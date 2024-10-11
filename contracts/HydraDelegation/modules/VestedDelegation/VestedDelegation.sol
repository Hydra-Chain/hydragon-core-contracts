// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "../../../common/Governed/Governed.sol";
import {Withdrawal} from "../../../common/Withdrawal/Withdrawal.sol";
import {VestedPositionLib} from "../../../common/Vesting/VestedPositionLib.sol";
import {VestingPosition} from "../../../common/Vesting/IVesting.sol";
import {Vesting} from "../../../common/Vesting/Vesting.sol";
import {DelegateRequirement} from "../../../common/Errors.sol";
import {HydraChainConnector} from "../../../HydraChain/HydraChainConnector.sol";
import {VestingManagerFactoryConnector} from "../../../VestingManager/VestingManagerFactoryConnector.sol";
import {RewardWalletConnector} from "../../../RewardWallet/RewardWalletConnector.sol";
import {Delegation} from "../../Delegation.sol";
import {DelegationPool} from "../../modules/DelegationPoolLib/DelegationPoolLib.sol";
import {DelegationPoolLib} from "../../modules/DelegationPoolLib/DelegationPoolLib.sol";
import {IVestedDelegation, RPS, DelegationPoolDelegatorParams} from "./IVestedDelegation.sol";

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
     * @notice The threshold for the maximum number of allowed balance changes
     * @dev We are using this to restrict unlimited changes of the balance (delegationPoolParamsHistory)
     */
    uint256 public balanceChangeThreshold;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __VestedDelegation_init(
        address _vestingManagerFactoryAddr,
        address _hydraChainAddr
    ) internal onlyInitializing {
        __VestingManagerFactoryConnector_init(_vestingManagerFactoryAddr);
        __HydraChainConnector_init(_hydraChainAddr);
        __VestedDelegation_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
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
    function calculatePositionClaimableReward(
        address staker,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external view returns (uint256) {
        VestingPosition memory position = vestedDelegationPositions[staker][delegator];
        if (_noRewardConditions(position)) {
            return 0;
        }

        _verifyPositionRewardsMatured(staker, position, epochNumber);

        DelegationPool storage delegationPool = delegationPools[staker];
        uint256 rewardIndex = delegationPool.claimableRewards(delegator, epochNumber, balanceChangeIndex);
        uint256 reward = _applyVestingAPR(position, rewardIndex);

        // If the full maturing period is finished, calculate also the reward made after the vesting period
        if (block.timestamp >= position.end + position.duration) {
            reward += _calcPositionAdditionalReward(delegationPool, delegator, rewardIndex);
        }

        return reward;
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function calculatePositionTotalReward(
        address staker,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external view returns (uint256) {
        VestingPosition memory position = vestedDelegationPositions[staker][delegator];
        // if the position is still active apply the vesting APR to the generated raw reward
        if (_noRewardConditions(position)) {
            return _applyVestingAPR(position, getRawDelegatorReward(staker, delegator));
        }

        _verifyRewardsMatured(staker, position.end, epochNumber);

        DelegationPool storage delegationPool = delegationPools[staker];
        // get the reward index for the vesting period
        uint256 vestingRewardIndex = delegationPool.claimableRewards(delegator, epochNumber, balanceChangeIndex);
        // apply the vesting APR for the reward
        uint256 reward = _applyVestingAPR(position, vestingRewardIndex);

        // the position has entered the maturing period, so, we have to calculate the additional
        //  reward made after the vesting period
        reward += _calcPositionAdditionalReward(delegationPool, delegator, vestingRewardIndex);

        return reward;
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function getRPSValues(address staker, uint256 startEpoch, uint256 endEpoch) external view returns (RPS[] memory) {
        return delegationPools[staker].getRPSValues(startEpoch, endEpoch);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function getDelegationPoolParamsHistory(
        address staker,
        address delegator
    ) external view returns (DelegationPoolDelegatorParams[] memory) {
        return delegationPools[staker].delegatorsParamsHistory[delegator];
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
    function delegateWithVesting(address staker, uint256 durationWeeks) external payable onlyManager {
        // ensure that the position is available
        if (!isPositionAvailable(staker, msg.sender)) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_UNAVAILABLE"});
        }

        // get the current balance of the delegator
        DelegationPool storage delegation = delegationPools[staker];
        uint256 balance = delegation.balanceOf(msg.sender);
        // we delete the previous position historical data to avoid any possible issues
        delegation.cleanDelegatorHistoricalData(msg.sender);

        uint256 duration = durationWeeks * 1 weeks;
        // TODO: calculate end of period instead of write in the cold storage. It is cheaper
        vestedDelegationPositions[staker][msg.sender] = VestingPosition({
            duration: duration,
            start: block.timestamp,
            end: block.timestamp + duration,
            base: aprCalculatorContract.getBaseAPR(),
            vestBonus: aprCalculatorContract.getVestingBonus(durationWeeks),
            rsiBonus: uint248(aprCalculatorContract.getRSIBonus())
        });

        _delegate(staker, msg.sender, msg.value);

        emit PositionOpened(msg.sender, staker, durationWeeks, msg.value + balance);
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
        // we delete the previous position historical data to avoid any possible issues
        delegationPools[newStaker].cleanDelegatorHistoricalData(msg.sender);

        // undelegate (withdraw & emit event) the old amount from the old position
        _baseUndelegate(oldStaker, msg.sender, amount);

        // transfer the old position parameters to the new one
        vestedDelegationPositions[newStaker][msg.sender] = VestingPosition({
            duration: oldPosition.duration,
            start: oldPosition.start,
            end: oldPosition.end,
            base: oldPosition.base,
            vestBonus: oldPosition.vestBonus,
            rsiBonus: oldPosition.rsiBonus
        });

        // delegate (deposit & emit event & check isActiveValidator) the old amount to the new position
        _baseDelegate(newStaker, msg.sender, amount);

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
            }

            _burnAmount(penalty);
        }

        _undelegate(staker, msg.sender, amount);
        uint256 amountAfterPenalty = amount - penalty;
        _registerWithdrawal(msg.sender, amountAfterPenalty);

        emit PositionCut(msg.sender, staker, amountAfterPenalty);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function claimPositionReward(
        address staker,
        address to,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external onlyManager {
        VestingPosition memory position = vestedDelegationPositions[staker][msg.sender];
        if (_noRewardConditions(position)) {
            return;
        }

        _verifyPositionRewardsMatured(staker, position, epochNumber);

        DelegationPool storage delegationPool = delegationPools[staker];
        uint256 reward = delegationPool.claimRewards(msg.sender, epochNumber, balanceChangeIndex);
        reward = _applyVestingAPR(position, reward);

        // If the full maturing period is finished, withdraw also the reward made after the vesting period
        if (block.timestamp >= position.end + position.duration) {
            uint256 additionalReward = delegationPool.claimRewards(msg.sender);
            reward += aprCalculatorContract.applyBaseAPR(additionalReward);
        }

        if (reward == 0) return;

        rewardWalletContract.distributeReward(to, reward);

        emit PositionRewardClaimed(msg.sender, staker, reward);
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
        return delegationPools[staker].isBalanceChangeMade(delegator, currentEpochNum);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function isPositionAvailable(address staker, address delegator) public view returns (bool) {
        VestingPosition memory position = vestedDelegationPositions[staker][delegator];
        if (position.isActive()) {
            return false;
        }

        if (getRawDelegatorReward(staker, delegator) != 0) {
            return false;
        }

        return true;
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function isPositionAvailableForSwap(address staker, address delegator) public view returns (bool) {
        if (!isPositionAvailable(staker, delegator)) {
            return false;
        }

        DelegationPool storage delegation = delegationPools[staker];
        uint256 balance = delegation.balanceOf(delegator);
        if (balance != 0) {
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

    function _depositDelegation(
        address staker,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual override {
        // If it is an vested delegation, withdraw by keeping the change in the delegation pool params
        // so vested rewards claiming is possible
        if (vestedDelegationPositions[staker][delegator].isInVestingCycle()) {
            return delegation.deposit(delegator, amount, hydraChainContract.getCurrentEpochId());
        }

        super._depositDelegation(staker, delegation, delegator, amount);
    }

    function _withdrawDelegation(
        address staker,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual override {
        // If it is an vested delegation, withdraw by keeping the change in the delegation pool params
        // so vested rewards claiming is possible
        if (vestedDelegationPositions[staker][delegator].isInVestingCycle()) {
            return delegation.withdraw(delegator, amount, hydraChainContract.getCurrentEpochId());
        }

        super._withdrawDelegation(staker, delegation, delegator, amount);
    }

    /**
     * @inheritdoc Delegation
     */
    function _undelegate(address staker, address delegator, uint256 amount) internal virtual override {
        super._undelegate(staker, delegator, amount);
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
     * @notice Calculates the delegators's vested pending reward
     * @param delegationPool Delegation pool of staker
     * @param delegator Address of delegator
     * @param vestedRewardIndex This is the raw reward generated for the vested period
     * @return reward Pending reward that is generated beyond the vested period (in HYDRA wei)
     */
    function _calcPositionAdditionalReward(
        DelegationPool storage delegationPool,
        address delegator,
        uint256 vestedRewardIndex
    ) private view returns (uint256 reward) {
        uint256 additionalRewardIndex = delegationPool.claimableRewards(delegator) - vestedRewardIndex;
        reward = aprCalculatorContract.applyBaseAPR(additionalRewardIndex);
    }

    function _verifyPositionRewardsMatured(
        address staker,
        VestingPosition memory position,
        uint256 epochNum
    ) private view {
        uint256 matureEnd = position.end + position.duration;
        uint256 alreadyMatured;
        // If full mature period is not finished, rewardPerShare must be fetched from the history records
        if (block.timestamp < matureEnd) {
            uint256 maturedPeriod = block.timestamp - position.end;
            alreadyMatured = position.start + maturedPeriod;
        } else {
            // otherwise the full reward up to the end of the vesting must be matured
            alreadyMatured = position.end;
        }

        _verifyRewardsMatured(staker, alreadyMatured, epochNum);
    }

    function _verifyRewardsMatured(address staker, uint256 alreadyMatured, uint256 epochNum) private view {
        RPS memory rpsData = delegationPools[staker].historyRPS[epochNum];
        if (rpsData.timestamp == 0) {
            revert DelegateRequirement({src: "_verifyRewardsMatured", msg: "INVALID_EPOCH"});
        }

        // If the given RPS is for future time - it is wrong, so revert
        if (rpsData.timestamp > alreadyMatured) {
            revert DelegateRequirement({src: "_verifyRewardsMatured", msg: "WRONG_RPS"});
        }
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
