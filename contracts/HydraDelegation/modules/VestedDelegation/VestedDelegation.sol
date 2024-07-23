// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "../../../common/Governed/Governed.sol";
import {Withdrawal} from "../../../common/Withdrawal/Withdrawal.sol";
import {VestedPositionLib} from "../../../common/Vesting/VestedPositionLib.sol";
import {VestingPosition} from "../../../common/Vesting/IVesting.sol";
import {Vesting} from "../../../common/Vesting/Vesting.sol";
import {HydraChainConnector} from "../../../HydraChain/HydraChainConnector.sol";
import {VestingManagerFactoryConnector} from "../../../VestingManager/VestingManagerFactoryConnector.sol";
import {RewardWalletConnector} from "../../../RewardWallet/RewardWalletConnector.sol";
import {Delegation} from "../../Delegation.sol";
import {DelegationPool} from "../../IDelegation.sol";
import {DelegationPoolLib} from "../../DelegationPoolLib.sol";
import {IVestedDelegation, DelegationPoolParams, RPS} from "./IVestedDelegation.sol";

abstract contract VestedDelegation is
    IVestedDelegation,
    Governed,
    Withdrawal,
    HydraChainConnector,
    RewardWalletConnector,
    Delegation,
    VestingManagerFactoryConnector,
    Vesting
{
    using DelegationPoolLib for DelegationPool;
    using VestedPositionLib for VestingPosition;

    /**
     * @notice The vesting positions for every delegator
     * @dev Staker => Delegator => VestingPosition
     */
    mapping(address => mapping(address => VestingPosition)) public vestedDelegationPositions;
    /**
     * @notice Historical Staker Delegation Pool's Params per delegator
     * @dev Staker => Delegator => Pool params data
     */
    mapping(address => mapping(address => DelegationPoolParams[])) public delegationPoolParamsHistory;
    /**
     * @notice Keeps the history of the RPS for the stakers
     * @dev This is used to keep the history RPS in order to calculate properly the rewards
     */
    mapping(address => mapping(uint256 => RPS)) public historyRPS;
    /**
     * @notice The threshold for the maximum number of allowed balance changes
     * @dev We are using this to restrict unlimited changes of the balance (delegationPoolParamsHistory)
     */
    uint256 public balanceChangeThreshold;

    // _______________ Initializer _______________

    function __VestedDelegation_init(
        address _vestingManagerFactoryAddr,
        address _hydraChainAddr
    ) internal onlyInitializing {
        __VestingManagerFactoryConnector_init(_vestingManagerFactoryAddr);
        __HydraChainConnector_init(_hydraChainAddr);
        __VestedDelegation_init_unchained();
    }

    function __VestedDelegation_init_unchained() internal onlyInitializing {
        balanceChangeThreshold = 32;
    }

    // _______________ Modifiers _______________

    modifier onlyManager() {
        if (!vestingManagerFactoryContract.isVestingManager(msg.sender)) {
            revert NotVestingManager();
        }
        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IVestedDelegation
     */
    function getDelegatorPositionReward(
        address staker,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external view returns (uint256 sumReward) {
        VestingPosition memory position = vestedDelegationPositions[staker][delegator];
        if (_noRewardConditions(position)) {
            return 0;
        }

        // distribute the proper vesting reward
        (uint256 epochRPS, uint256 balance, int256 correction) = _rewardParams(
            staker,
            delegator,
            epochNumber,
            balanceChangeIndex
        );

        DelegationPool storage delegationPool = delegationPools[staker];
        uint256 rewardIndex = delegationPool.claimableRewards(delegator, epochRPS, balance, correction);
        sumReward = _applyVestingAPR(position, rewardIndex, true);

        // If the full maturing period is finished, withdraw also the reward made after the vesting period
        if (block.timestamp > position.end + position.duration) {
            uint256 additionalRewardIndex = delegationPool.claimableRewards(delegator) - rewardIndex;
            sumReward += aprCalculatorContract.applyBaseAPR(additionalRewardIndex);
        }
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function getRPSValues(address staker, uint256 startEpoch, uint256 endEpoch) external view returns (RPS[] memory) {
        require(startEpoch <= endEpoch, "Invalid args");

        RPS[] memory values = new RPS[](endEpoch - startEpoch + 1);
        uint256 itemIndex = 0;
        for (uint256 i = startEpoch; i <= endEpoch; i++) {
            if (historyRPS[staker][i].value != 0) {
                values[itemIndex] = (historyRPS[staker][i]);
            }

            itemIndex++;
        }

        return values;
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function getDelegationPoolParamsHistory(
        address staker,
        address delegator
    ) external view returns (DelegationPoolParams[] memory) {
        return delegationPoolParamsHistory[staker][delegator];
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function calculatePositionPenalty(
        address staker,
        address delegator,
        uint256 amount
    ) external view returns (uint256 penalty) {
        VestingPosition memory position = vestedDelegationPositions[staker][delegator];
        if (position.isActive()) {
            penalty = _calcPenalty(position, amount);
        }
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function isActiveDelegatePosition(address staker, address delegator) external view returns (bool) {
        return vestedDelegationPositions[staker][delegator].isActive();
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function isMaturingDelegatePosition(address staker, address delegator) external view returns (bool) {
        return vestedDelegationPositions[staker][delegator].isMaturing();
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function swapVestedPositionStaker(address oldStaker, address newStaker) external onlyManager {
        VestingPosition memory oldPosition = vestedDelegationPositions[oldStaker][msg.sender];
        // ensure that the old position is active in order to continue the swap
        if (!oldPosition.isActive()) {
            revert DelegateRequirement({src: "vesting", msg: "OLD_POSITION_INACTIVE"});
        }

        // ensure that the new position is available
        if (!isPositionAvailableForSwap(newStaker, msg.sender)) {
            revert DelegateRequirement({src: "vesting", msg: "NEW_POSITION_UNAVAILABLE"});
        }

        // update the old delegation position
        DelegationPool storage oldDelegation = delegationPools[oldStaker];
        uint256 amount = oldDelegation.balanceOf(msg.sender);

        // undelegate (withdraw & emit event) the old amount from the old position
        _baseUndelegate(oldStaker, msg.sender, amount);

        int256 correction = oldDelegation.correctionOf(msg.sender);
        _saveAccountParamsChange(
            oldStaker,
            msg.sender,
            DelegationPoolParams({balance: 0, correction: correction, epochNum: hydraChainContract.getCurrentEpochId()})
        );

        DelegationPool storage newDelegation = delegationPools[newStaker];
        // delegate (deposit & emit event & check isActiveValidator) the old amount to the new position
        _baseDelegate(newStaker, msg.sender, amount);

        // transfer the old position parameters to the new one
        vestedDelegationPositions[newStaker][msg.sender] = VestingPosition({
            duration: oldPosition.duration,
            start: oldPosition.start,
            end: oldPosition.end,
            base: oldPosition.base,
            vestBonus: oldPosition.vestBonus,
            rsiBonus: oldPosition.rsiBonus
        });

        // keep the change in the new delegation pool params
        _saveAccountParamsChange(
            newStaker,
            msg.sender,
            DelegationPoolParams({
                balance: amount,
                correction: newDelegation.correctionOf(msg.sender),
                epochNum: hydraChainContract.getCurrentEpochId()
            })
        );

        emit PositionSwapped(msg.sender, oldStaker, newStaker, amount);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function undelegateWithVesting(address staker, uint256 amount) external onlyManager {
        DelegationPool storage delegation = delegationPools[staker];
        VestingPosition memory position = vestedDelegationPositions[staker][msg.sender];
        uint256 delegatedAmount = delegation.balanceOf(msg.sender);
        uint256 delegatedAmountLeft = delegatedAmount - amount;
        uint256 penalty;
        if (position.isActive()) {
            penalty = _calcPenalty(position, amount);
            // claim rewards to clear them (but without distributing) because the delegator loses its rewards
            delegation.claimRewards(msg.sender);

            // if position is closed when active, we delete the vesting data
            if (delegatedAmountLeft == 0) {
                delete vestedDelegationPositions[staker][msg.sender];
                delete delegationPoolParamsHistory[staker][msg.sender];
            } else {
                // keep the change in the account pool params
                _saveAccountParamsChange(
                    staker,
                    msg.sender,
                    DelegationPoolParams({
                        balance: delegation.balanceOf(msg.sender),
                        correction: delegation.correctionOf(msg.sender),
                        epochNum: hydraChainContract.getCurrentEpochId()
                    })
                );
            }
        }

        _undelegate(staker, msg.sender, amount);
        uint256 amountAfterPenalty = amount - penalty;
        _burnAmount(penalty);
        _registerWithdrawal(msg.sender, amountAfterPenalty);

        emit PositionCut(msg.sender, staker, amountAfterPenalty);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function claimPositionReward(address staker, address to, uint256 epochNumber, uint256 balanceChangeIndex) external onlyManager {
        VestingPosition memory position = vestedDelegationPositions[staker][msg.sender];
        if (_noRewardConditions(position)) {
            return;
        }

        uint256 sumReward;
        DelegationPool storage delegationPool = delegationPools[staker];

        // distribute the proper vesting reward
        (uint256 epochRPS, uint256 balance, int256 correction) = _rewardParams(
            staker,
            msg.sender,
            epochNumber,
            balanceChangeIndex
        );

        uint256 reward = delegationPool.claimRewards(msg.sender, epochRPS, balance, correction);
        reward = _applyVestingAPR(position, reward, true);
        sumReward += reward;

        // If the full maturing period is finished, withdraw also the reward made after the vesting period
        if (block.timestamp > position.end + position.duration) {
            uint256 additionalReward = delegationPool.claimRewards(msg.sender);
            additionalReward = aprCalculatorContract.applyBaseAPR(additionalReward);
            sumReward += additionalReward;
        }

        if (sumReward == 0) return;

        rewardWalletContract.distributeReward(to, sumReward);

        emit PositionRewardClaimed(msg.sender, staker, sumReward);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function delegateWithVesting(address staker, uint256 durationWeeks) external payable onlyManager {
        VestingPosition memory position = vestedDelegationPositions[staker][msg.sender];
        if (position.isMaturing()) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_MATURING"});
        }

        if (position.isActive()) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_ACTIVE"});
        }

        // ensure previous rewards are claimed
        DelegationPool storage delegation = delegationPools[staker];
        if (delegation.claimableRewards(msg.sender) > 0) {
            revert DelegateRequirement({src: "vesting", msg: "REWARDS_NOT_CLAIMED"});
        }

        uint256 duration = durationWeeks * 1 weeks;
        delete delegationPoolParamsHistory[staker][msg.sender];
        // TODO: calculate end of period instead of write in the cold storage. It is cheaper
        vestedDelegationPositions[staker][msg.sender] = VestingPosition({
            duration: duration,
            start: block.timestamp,
            end: block.timestamp + duration,
            base: aprCalculatorContract.getBaseAPR(),
            vestBonus: aprCalculatorContract.getVestingBonus(durationWeeks),
            rsiBonus: uint248(aprCalculatorContract.getRSIBonus())
        });

        // keep the change in the delegation pool params per account
        _saveAccountParamsChange(
            staker,
            msg.sender,
            DelegationPoolParams({
                balance: delegationOf(staker, msg.sender),
                correction: delegation.correctionOf(msg.sender),
                epochNum: hydraChainContract.getCurrentEpochId()
            })
        );

        _delegate(staker, msg.sender, msg.value);

        emit PositionOpened(msg.sender, staker, durationWeeks, msg.value);
    }

    // _______________ Public functions _______________

    // TODO: Check if the commitEpoch is the last transaction in the epoch, otherwise bug may occur
    /**
     * @inheritdoc IVestedDelegation
     */
    function isBalanceChangeMade(
        address staker,
        address delegator,
        uint256 currentEpochNum
    ) public view returns (bool) {
        uint256 length = delegationPoolParamsHistory[staker][delegator].length;
        if (length == 0) {
            return false;
        }

        DelegationPoolParams memory data = delegationPoolParamsHistory[staker][delegator][length - 1];
        if (data.epochNum == currentEpochNum) {
            return true;
        }

        return false;
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function isPositionAvailableForSwap(address newStaker, address delegator) public view returns (bool) {
        VestingPosition memory newPosition = vestedDelegationPositions[newStaker][delegator];
        // TODO: maturing can be missed as condition beacause if there are no rewards that must mature after the end of the position - its fine to delete the position
        if (newPosition.isActive() || newPosition.isMaturing()) {
            return false;
        }

        DelegationPool storage newDelegation = delegationPools[newStaker];
        uint256 balance = newDelegation.balanceOf(delegator);
        if (balance != 0 || getRawDelegatorReward(newStaker, delegator) > 0) {
            return false;
        }

        return true;
    }

    // TODO: Consider deleting it as we shouldn't be getting into that case
    /**
     * @inheritdoc IVestedDelegation
     */
    function isBalanceChangeThresholdExceeded(address staker, address delegator) public view returns (bool) {
        return delegationPoolParamsHistory[staker][delegator].length > balanceChangeThreshold;
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
     * @notice Saves the RPS for the given staker for the epoch
     * @param staker Address of the validator
     * @param rewardPerShare Amount of tokens to be withdrawn
     * @param epochNumber Epoch number
     */
    function _saveEpochRPS(address staker, uint256 rewardPerShare, uint256 epochNumber) internal {
        require(rewardPerShare > 0, "rewardPerShare must be greater than 0");

        RPS memory stakerRPSes = historyRPS[staker][epochNumber];
        require(stakerRPSes.value == 0, "RPS already saved");

        historyRPS[staker][epochNumber] = RPS({value: uint192(rewardPerShare), timestamp: uint64(block.timestamp)});
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
     * @notice Saves the account specific pool params change
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param params Delegation pool params
     */
    function _saveAccountParamsChange(address staker, address delegator, DelegationPoolParams memory params) private {
        if (isBalanceChangeMade(staker, delegator, params.epochNum)) {
            // balance can be changed only once per epoch
            revert DelegateRequirement({src: "_saveAccountParamsChange", msg: "BALANCE_CHANGE_ALREADY_MADE"});
        }

        delegationPoolParamsHistory[staker][delegator].push(params);
    }

    /**
     * @notice Gets the account specific pool params for the given epoch
     * @param staker Address of the validator
     * @param manager Address of the vest manager
     * @param epochNumber Epoch number
     * @param paramsIndex Index of the params
     */
    function _getAccountParams(
        address staker,
        address manager,
        uint256 epochNumber,
        uint256 paramsIndex
    ) private view returns (uint256 balance, int256 correction) {
        if (paramsIndex >= delegationPoolParamsHistory[staker][manager].length) {
            revert DelegateRequirement({src: "vesting", msg: "INVALID_PARAMS_INDEX"});
        }

        DelegationPoolParams memory params = delegationPoolParamsHistory[staker][manager][paramsIndex];
        if (params.epochNum > epochNumber) {
            revert DelegateRequirement({src: "vesting", msg: "LATE_BALANCE_CHANGE"});
        } else if (params.epochNum == epochNumber) {
            // If balance change is made exactly in the epoch with the given index - it is the valid one for sure
            // because the balance change is made exactly before the distribution of the reward in this epoch
        } else {
            // This is the case where the balance change is before the handled epoch (epochNumber)
            if (paramsIndex == delegationPoolParamsHistory[staker][manager].length - 1) {
                // If it is the last balance change - don't check does the next one can be better
            } else {
                // If it is not the last balance change - check does the next one can be better
                // We just need the right account specific pool params for the given RPS, to be able
                // to properly calculate the reward
                DelegationPoolParams memory nextParamsRecord = delegationPoolParamsHistory[staker][manager][
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
     * @notice Gets the reward parameters for the given staker and manager
     * @param staker Address of the validator
     * @param manager Address of the vest manager
     * @param epochNumber Epoch number
     * @param balanceChangeIndex Index of the balance change
     */
    function _rewardParams(
        address staker,
        address manager,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) private view returns (uint256 rps, uint256 balance, int256 correction) {
        VestingPosition memory position = vestedDelegationPositions[staker][manager];
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

        RPS memory rpsData = historyRPS[staker][epochNumber];
        if (rpsData.timestamp == 0) {
            revert DelegateRequirement({src: "vesting", msg: "INVALID_EPOCH"});
        }

        // If the given RPS is for future time - it is wrong, so revert
        if (rpsData.timestamp > alreadyMatured) {
            revert DelegateRequirement({src: "vesting", msg: "WRONG_RPS"});
        }

        uint256 rewardPerShare = rpsData.value;
        (uint256 balanceData, int256 correctionData) = _getAccountParams(
            staker,
            manager,
            epochNumber,
            balanceChangeIndex
        );

        return (rewardPerShare, balanceData, correctionData);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
