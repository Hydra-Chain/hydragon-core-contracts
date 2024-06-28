// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Delegation} from "./../../Delegation.sol";
import {Governed} from "./../../../common/Governed/Governed.sol";
import {Withdrawal} from "./../../../common/Withdrawal/Withdrawal.sol";
import {APRCalculatorConnector} from "./../../../APRCalculator/APRCalculatorConnector.sol";
import {EpochManagerConnector} from "./../../../HydraChain/modules/EpochManager/EpochManagerConnector.sol";
import {VestingManagerFactory} from "./../VestingManagerFactory/VestingManagerFactory.sol";
import {DelegationPoolLib} from "./../../DelegationPoolLib.sol";
import {VestedPositionLib} from "./../../../common/Vesting/VestedPositionLib.sol";
import {DelegationPool} from "./../../IDelegation.sol";
import {VestingPosition} from "./../../../common/Vesting/IVesting.sol";
import {IVestedDelegation, DelegationPoolParams, RPS} from "./IVestedDelegation.sol";

contract VestedDelegation is
    IVestedDelegation,
    Governed,
    Withdrawal,
    APRCalculatorConnector,
    Delegation,
    VestingManagerFactory,
    EpochManagerConnector
{
    using DelegationPoolLib for DelegationPool;
    using VestedPositionLib for VestingPosition;

    mapping(address => address) public vestingManagers;
    /// @notice Additional mapping to store all vesting managers per user address for fast off-chain lookup
    mapping(address => address[]) public userVestManagers;
    /**
     * @notice The vesting positions for every delegator
     * @dev Validator => Delegator => VestingPosition
     */
    mapping(address => mapping(address => VestingPosition)) public vestedDelegationPositions;
    /**
     * @notice Historical Validator Delegation Pool's Params per delegator
     * @dev Validator => Delegator => Pool params data
     */
    mapping(address => mapping(address => DelegationPoolParams[])) public delegationPoolParamsHistory;
    /**
     * @notice A constant for the calculation of the weeks left of a vesting period
     * @dev Representing a week in seconds - 1
     */
    uint256 private constant WEEK_MINUS_SECOND = 604799;

    /**
     * @notice The threshold for the maximum number of allowed balance changes
     * @dev We are using this to restrict unlimited changes of the balance (delegationPoolParamsHistory)
     */
    uint256 public balanceChangeThreshold;
    /**
     * @notice Keeps the history of the RPS for the validators
     * @dev This is used to keep the history RPS in order to calculate properly the rewards
     */
    mapping(address => mapping(uint256 => RPS)) public historyRPS;

    error NotVestingManager();

    // _______________ Initializer _______________

    function __VestedDelegation_init(address _epochManagerAddr) internal onlyInitializing {
        __VestFactory_init();
        __EpochManagerConnector_init(_epochManagerAddr);
        __VestedDelegation_init_unchained();
    }

    function __VestedDelegation_init_unchained() internal onlyInitializing {
        balanceChangeThreshold = 32;
    }

    // _______________ Modifiers _______________

    modifier onlyManager() {
        if (!isVestingManager(msg.sender)) {
            revert NotVestingManager();
        }
        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IVestedDelegation
     */
    function newManager(address rewardPool) external {
        require(msg.sender != address(0), "INVALID_OWNER");

        address managerAddr = _clone(msg.sender, rewardPool);
        _storeVestManagerData(managerAddr, msg.sender);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function getUserVestingManagers(address user) external view returns (address[] memory) {
        return userVestManagers[user];
    }

    
    /**
     * @inheritdoc IVestedDelegation
     */
    function swapVestedPositionValidator(address oldValidator, address newValidator) external onlyManager {
        VestingPosition memory oldPosition = vestedDelegationPositions[oldValidator][msg.sender];
        // ensure that the old position is active in order to continue the swap
        if (!oldPosition.isActive()) {
            revert DelegateRequirement({src: "vesting", msg: "OLD_POSITION_INACTIVE"});
        }

        // ensure that the new position is available
        if (!isPositionAvailableForSwap(newValidator, msg.sender)) {
            revert DelegateRequirement({src: "vesting", msg: "NEW_POSITION_UNAVAILABLE"});
        }

        // update the old delegation position
        DelegationPool storage oldDelegation = delegationPools[oldValidator];
        uint256 amount = oldDelegation.balanceOf(msg.sender);
        oldDelegation.withdraw(msg.sender, amount);

        int256 correction = oldDelegation.correctionOf(msg.sender);
        _saveAccountParamsChange(
            oldValidator,
            msg.sender,
            DelegationPoolParams({
                balance: 0,
                correction: correction,
                epochNum: epochManagerContract.getCurrentEpochId()
            })
        );

        DelegationPool storage newDelegation = delegationPools[newValidator];
        // deposit the old amount to the new position
        newDelegation.deposit(msg.sender, amount);

        // transfer the old position parameters to the new one
        vestedDelegationPositions[newValidator][msg.sender] = VestingPosition({
            duration: oldPosition.duration,
            start: oldPosition.start,
            end: oldPosition.end,
            base: oldPosition.base,
            vestBonus: oldPosition.vestBonus,
            rsiBonus: oldPosition.rsiBonus
        });

        // keep the change in the new delegation pool params
        _saveAccountParamsChange(
            newValidator,
            msg.sender,
            DelegationPoolParams({
                balance: amount,
                correction: newDelegation.correctionOf(msg.sender),
                epochNum: epochManagerContract.getCurrentEpochId()
            })
        );

        _baseDelegate(oldValidator, msg.sender, amount);
        _baseUndelegate(newValidator, msg.sender, amount);

        emit PositionSwapped(msg.sender, oldValidator, newValidator, amount);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function undelegateWithVesting(address validator, uint256 amount) external onlyManager {
        DelegationPool storage delegation = delegationPools[validator];
        VestingPosition memory position = vestedDelegationPositions[validator][msg.sender];
        uint256 delegatedAmount = delegation.balanceOf(msg.sender);
        uint256 delegatedAmountLeft = delegatedAmount - amount;
        uint256 penalty;
        uint256 fullReward;
        if (position.isActive()) {
            penalty = _calcPenalty(position, amount);
            // apply the max Vesting bonus, because the full reward must be burned
            fullReward = aprCalculatorContract.applyMaxReward(delegation.claimRewards(msg.sender));

            // if position is closed when active, we delete the vesting data
            if (delegatedAmountLeft == 0) {
                delete vestedDelegationPositions[validator][msg.sender];
                delete delegationPoolParamsHistory[validator][msg.sender];
            } else {
                // keep the change in the account pool params
                _saveAccountParamsChange(
                    validator,
                    msg.sender,
                    DelegationPoolParams({
                        balance: delegation.balanceOf(msg.sender),
                        correction: delegation.correctionOf(msg.sender),
                        epochNum: epochManagerContract.getCurrentEpochId()
                    })
                );
            }
        }

        if (fullReward != 0) {
            penalty += fullReward;
        }

        _undelegate(validator, msg.sender, amount);
        uint256 amountAfterPenalty = amount - penalty;
        _burnAmount(penalty);
        _registerWithdrawal(msg.sender, amountAfterPenalty);

        emit PositionCut(msg.sender, validator, amountAfterPenalty);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function claimPositionReward(
        address validator,
        address to,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external {
        VestingPosition memory position = vestedDelegationPositions[validator][msg.sender];
        if (_noRewardConditions(position)) {
            return;
        }

        uint256 sumReward;
        uint256 sumMaxReward;
        DelegationPool storage delegationPool = delegationPools[validator];

        // distribute the proper vesting reward
        (uint256 epochRPS, uint256 balance, int256 correction) = _rewardParams(
            validator,
            msg.sender,
            epochNumber,
            balanceChangeIndex
        );

        uint256 reward = delegationPool.claimRewards(msg.sender, epochRPS, balance, correction);
        uint256 maxReward = aprCalculatorContract.applyMaxReward(reward);
        reward = _applyVestingAPR(position, reward, true);
        sumReward += reward;
        sumMaxReward += maxReward;

        // If the full maturing period is finished, withdraw also the reward made after the vesting period
        if (block.timestamp > position.end + position.duration) {
            uint256 additionalReward = delegationPool.claimRewards(msg.sender);
            uint256 maxAdditionalReward = aprCalculatorContract.applyMaxReward(additionalReward);
            additionalReward = aprCalculatorContract.applyBaseAPR(additionalReward);
            sumReward += additionalReward;
            sumMaxReward += maxAdditionalReward;
        }

        uint256 remainder = sumMaxReward - sumReward;
        if (remainder > 0) {
            _burnAmount(remainder);
        }

        if (sumReward == 0) return;

        _withdraw(to, sumReward);

        emit PositionRewardClaimed(msg.sender, validator, sumReward);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function delegateWithVesting(address validator, uint256 durationWeeks) external payable onlyManager {
        _delegate(validator, msg.sender, msg.value);

        VestingPosition memory position = vestedDelegationPositions[validator][msg.sender];
        if (position.isMaturing()) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_MATURING"});
        }

        if (position.isActive()) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_ACTIVE"});
        }

        // ensure previous rewards are claimed
        DelegationPool storage delegation = delegationPools[validator];
        if (delegation.claimableRewards(msg.sender) > 0) {
            revert DelegateRequirement({src: "vesting", msg: "REWARDS_NOT_CLAIMED"});
        }

        uint256 duration = durationWeeks * 1 weeks;
        delete delegationPoolParamsHistory[validator][msg.sender];
        // TODO: calculate end of period instead of write in in the cold storage. It is cheaper
        vestedDelegationPositions[validator][msg.sender] = VestingPosition({
            duration: duration,
            start: block.timestamp,
            end: block.timestamp + duration,
            base: aprCalculatorContract.getBaseAPR(),
            vestBonus: aprCalculatorContract.getVestingBonus(durationWeeks),
            rsiBonus: uint248(aprCalculatorContract.getRSIBonus())
        });

        // keep the change in the delegation pool params per account
        _saveAccountParamsChange(
            validator,
            msg.sender,
            DelegationPoolParams({
                balance: delegationOf(validator, msg.sender),
                correction: delegation.correctionOf(msg.sender),
                epochNum: epochManagerContract.getCurrentEpochId()
            })
        );

        emit PositionOpened(msg.sender, validator, durationWeeks, msg.value);
    }

    // _______________ Public functions _______________

    /**
     * @notice Claims that a delegator is a vest manager or not.
     * @param delegator Delegator's address
     */
    function isVestingManager(address delegator) public view returns (bool) {
        return vestingManagers[delegator] != address(0);
    }

    // TODO: Check if the commitEpoch is the last transaction in the epoch, otherwise bug may occur
    /**
     * @notice Checks if balance change was already made in the current epoch
     * @param validator Validator to delegate to
     * @param delegator Delegator that has delegated
     * @param currentEpochNum Current epoch number
     */
    function isBalanceChangeMade(
        address validator,
        address delegator,
        uint256 currentEpochNum
    ) public view returns (bool) {
        uint256 length = delegationPoolParamsHistory[validator][delegator].length;
        if (length == 0) {
            return false;
        }

        DelegationPoolParams memory data = delegationPoolParamsHistory[validator][delegator][length - 1];
        if (data.epochNum == currentEpochNum) {
            return true;
        }

        return false;
    }

    // TODO: Consider deleting it as we shouldn't be getting into that case
    /**
     * @notice Checks if the balance changes exceeds the threshold
     * @param validator Validator to delegate to
     * @param delegator Delegator that has delegated
     */
    function isBalanceChangeThresholdExceeded(address validator, address delegator) public view returns (bool) {
        return delegationPoolParamsHistory[validator][delegator].length > balanceChangeThreshold;
    }

    /**
     * @notice Check if the new position that the user wants to swap to is available for the swap
     * @dev Available positions one that is not active, not maturing and doesn't have any left balance or rewards
     * @param newValidator The address of the new validator
     * @param delegator The address of the delegator
     */
    function isPositionAvailableForSwap(address newValidator, address delegator) public view returns (bool) {
        VestingPosition memory newPosition = vestedDelegationPositions[newValidator][delegator];
        if (newPosition.isActive() || newPosition.isMaturing()) {
            return false;
        }

        DelegationPool storage newDelegation = delegationPools[newValidator];
        uint256 balance = newDelegation.balanceOf(delegator);
        if (balance != 0 || getRawDelegatorReward(newValidator, delegator) > 0) {
            return false;
        }

        return true;
    }


    // _______________ Internal functions _______________

    /**
     * @inheritdoc Delegation
     */
    function _delegate(address staker, address delegator, uint256 amount) internal virtual override {
        super._delegate(staker, delegator, amount);
    }

    /**
     * @inheritdoc Delegation
     */
    function _undelegate(address staker, address delegator, uint256 amount) internal virtual override {
        super._undelegate(staker, delegator, amount);
    }

    /**
     * @notice Distributes the tokens to the delegator
     * @param staker The address of the validator
     * @param reward The reward to be distributed
     * @param epochId The epoch number
     */
    function _distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) internal virtual {
        _distributeDelegationRewards(staker, reward);

        // Keep history record of the rewardPerShare to be used on reward claim
        if (reward > 0) {
            _saveEpochRPS(staker, delegationPools[staker].magnifiedRewardPerShare, epochId);
        }
    }


    /**
     * @notice Function that applies the custom factors - base APR, vest bonus and rsi bonus
     * @dev Denominator is used because we should work with floating-point numbers
     * @param reward index The reward to which we gonna apply the custom APR
     * @dev The reward with the applied APR
     */
    function _applyVestingAPR(
        VestingPosition memory position,
        uint256 reward,
        bool rsi
    ) internal view returns (uint256) {
        uint256 bonus = (position.base + position.vestBonus);
        uint256 divider = aprCalculatorContract.getDENOMINATOR();
        if (rsi && position.rsiBonus != 0) {
            bonus = bonus * position.rsiBonus;
            divider *= divider;
        }

        return (reward * bonus) / divider / aprCalculatorContract.getEpochsPerYear();
    }

    /**
     * @notice Calculates what part of the provided amount of tokens to be slashed
     * @param amount Amount of tokens to be slashed
     * @dev Invoke only when position is active, otherwise - underflow
     */
    function _calcPenalty(VestingPosition memory position, uint256 amount) internal view returns (uint256) {
        uint256 leftPeriod = position.end - block.timestamp;
        uint256 leftWeeks = (leftPeriod + WEEK_MINUS_SECOND) / 1 weeks;
        uint256 bps = 30 * leftWeeks; // 0.3% * left weeks

        return (amount * bps) / aprCalculatorContract.getDENOMINATOR();
    }

    /**
     * @notice Burns the provided amount of tokens
     * @param amount Amount of tokens to be burned
     */
    function _burnAmount(uint256 amount) private {
        (bool success, ) = address(0).call{value: amount}("");
        require(success, "Failed to burn amount");
    }

    /**
     * @notice Saves the RPS for the given validator for the epoch
     * @param validator Address of the validator
     * @param rewardPerShare Amount of tokens to be withdrawn
     * @param epochNumber Epoch number
     */
    function _saveEpochRPS(address validator, uint256 rewardPerShare, uint256 epochNumber) internal {
        require(rewardPerShare > 0, "rewardPerShare must be greater than 0");

        RPS memory validatorRPSes = historyRPS[validator][epochNumber];
        require(validatorRPSes.value == 0, "RPS already saved");

        historyRPS[validator][epochNumber] = RPS({value: uint192(rewardPerShare), timestamp: uint64(block.timestamp)});
    }

    /**
     * @notice Checks if the position has no reward conditions
     * @param position The vesting position
     * @dev If the position is still unused or active, there is no reward
     */
    function _noRewardConditions(VestingPosition memory position) private view returns (bool) {
        // If still unused position, there is no reward
        if (position.start == 0) {
            return true;
        }

        // if the position is still active, there is no matured reward
        if (position.isActive()) {
            return true;
        }

        return false;
    }

    // _______________ Private functions _______________

    /**
     * @notice Stores the vesting manager data
     * @param vestManager Address of the vesting manager
     * @param owner Address of the vest manager owner
     */
    function _storeVestManagerData(address vestManager, address owner) private {
        vestingManagers[vestManager] = owner;
        userVestManagers[owner].push(vestManager);
    }

    /**
     * @notice Saves the account specific pool params change
     * @param validator Address of the validator
     * @param delegator Address of the delegator
     * @param params Delegation pool params
     */
    function _saveAccountParamsChange(
        address validator,
        address delegator,
        DelegationPoolParams memory params
    ) private {
        if (isBalanceChangeMade(validator, delegator, params.epochNum)) {
            // balance can be changed only once per epoch
            revert DelegateRequirement({src: "_saveAccountParamsChange", msg: "BALANCE_CHANGE_ALREADY_MADE"});
        }

        if (isBalanceChangeThresholdExceeded(validator, delegator)) {
            // maximum amount of balance changes exceeded
            revert DelegateRequirement({src: "_saveAccountParamsChange", msg: "BALANCE_CHANGES_EXCEEDED"});
        }

        delegationPoolParamsHistory[validator][delegator].push(params);
    }


    /**
     * @notice Gets the account specific pool params for the given epoch
     * @param validator Address of the validator
     * @param manager Address of the vest manager
     * @param epochNumber Epoch number
     * @param paramsIndex Index of the params
     */
    function _getAccountParams(
        address validator,
        address manager,
        uint256 epochNumber,
        uint256 paramsIndex
    ) private view returns (uint256 balance, int256 correction) {
        if (paramsIndex >= delegationPoolParamsHistory[validator][manager].length) {
            revert DelegateRequirement({src: "vesting", msg: "INVALID_PARAMS_INDEX"});
        }

        DelegationPoolParams memory params = delegationPoolParamsHistory[validator][manager][paramsIndex];
        if (params.epochNum > epochNumber) {
            revert DelegateRequirement({src: "vesting", msg: "LATE_BALANCE_CHANGE"});
        } else if (params.epochNum == epochNumber) {
            // If balance change is made exactly in the epoch with the given index - it is the valid one for sure
            // because the balance change is made exactly before the distribution of the reward in this epoch
        } else {
            // This is the case where the balance change is before the handled epoch (epochNumber)
            if (paramsIndex == delegationPoolParamsHistory[validator][manager].length - 1) {
                // If it is the last balance change - don't check does the next one can be better
            } else {
                // If it is not the last balance change - check does the next one can be better
                // We just need the right account specific pool params for the given RPS, to be able
                // to properly calculate the reward
                DelegationPoolParams memory nextParamsRecord = delegationPoolParamsHistory[validator][manager][
                    paramsIndex + 1
                ];
                if (nextParamsRecord.epochNum <= epochNumber) {
                    // If the next balance change is made in an epoch before the handled one or in the same epoch
                    // and is bigger than the provided balance change - the provided one is not valid.
                    // Because when the reward was distributed for the given epoch, the account balance was different
                    revert DelegateRequirement({src: "vesting", msg: "EARLY_BALANCE_CHANGE"});
                }
            }
        }

        return (params.balance, params.correction);
    }

    /**
     * @notice Gets the reward parameters for the given validator and manager
     * @param validator Address of the validator
     * @param manager Address of the vest manager
     * @param epochNumber Epoch number
     * @param balanceChangeIndex Index of the balance change
     */
    function _rewardParams(
        address validator,
        address manager,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) private view returns (uint256 rps, uint256 balance, int256 correction) {
        VestingPosition memory position = vestedDelegationPositions[validator][manager];
        uint256 matureEnd = position.end + position.duration;
        uint256 alreadyMatured;
        // If full mature period is finished, the full reward up to the end of the vesting must be matured
        if (matureEnd < block.timestamp) {
            alreadyMatured = position.end;
        } else {
            // rewardPerShare must be fetched from the history records
            uint256 maturedPeriod = block.timestamp - position.end;
            alreadyMatured = position.start + maturedPeriod;
        }

        RPS memory rpsData = historyRPS[validator][epochNumber];
        if (rpsData.timestamp == 0) {
            revert DelegateRequirement({src: "vesting", msg: "INVALID_EPOCH"});
        }

        // If the given RPS is for future time - it is wrong, so revert
        if (rpsData.timestamp > alreadyMatured) {
            revert DelegateRequirement({src: "vesting", msg: "WRONG_RPS"});
        }

        uint256 rewardPerShare = rpsData.value;
        (uint256 balanceData, int256 correctionData) = _getAccountParams(
            validator,
            manager,
            epochNumber,
            balanceChangeIndex
        );

        return (rewardPerShare, balanceData, correctionData);
    }

}
