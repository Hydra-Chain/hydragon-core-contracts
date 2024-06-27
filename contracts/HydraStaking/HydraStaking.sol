// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./Staking.sol";
import {System} from "./../common/System/System.sol";
import {Unauthorized, StakeRequirement} from "./../common/Errors.sol";
import {LiquidStaking} from "./modules/LiquidStaking/LiquidStaking.sol";
import {VestedStaking} from "./modules/VestedStaking/VestedStaking.sol";
import {DelegatedStaking} from "./modules/DelegatedStaking/DelegatedStaking.sol";
import {StateSyncStaking} from "./modules/StateSyncStaking/StateSyncStaking.sol";
import {ValidatorManagerConnector} from "./modules/ValidatorManagerConnector.sol";
import {PenalizeableStaking} from "./modules/PenalizeableStaking/PenalizeableStaking.sol";
import {IHydraStaking, StakerInit} from "./IHydraStaking.sol";
import {PenalizedStakeDistribution} from "./modules/PenalizeableStaking/IPenalizeableStaking.sol";
import {Uptime} from "./../HydraChain/modules/ValidatorManager/IValidatorManager.sol";
import {EpochManagerConnector} from "./../HydraChain/modules/EpochManager/EpochManagerConnector.sol";
import {Governed} from "./../common/Governed/Governed.sol";
import {DelegationPool} from "./../HydraDelegation/IDelegation.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

contract HydraStaking is
    IHydraStaking,
    System,
    ValidatorManagerConnector,
    EpochManagerConnector,
    Staking,
    LiquidStaking,
    StateSyncStaking,
    VestedStaking,
    PenalizeableStaking,
    DelegatedStaking
{
    /// @notice Mapping used to keep the paid rewards per epoch
    mapping(uint256 => uint256) public distributedRewardPerEpoch;

    // TODO: Properly set up initializers

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by Hydra client at genesis to set up the initial set.
     * @dev only callable by client, can only be called once
     */
    function initialize(
        StakerInit[] calldata initialStakers,
        uint256 newMinStake,
        address newLiquidToken
    ) external initializer onlySystemCall {
        __Staking_init(newMinStake);
        __LiquidStaking_init(newLiquidToken);
        _initialize(initialStakers);
    }

    function _initialize(StakerInit[] calldata initialStakers) private {
        // set initial validators
        for (uint256 i = 0; i < initialStakers.length; i++) {
            _stake(initialStakers[i].addr, initialStakers[i].stake);
        }
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IHydraStaking
     */
    function distributeRewardsFor(
        uint256 epochId,
        Uptime[] calldata uptime,
        uint256 epochSize
    ) external payable onlySystemCall {
        require(distributedRewardPerEpoch[epochId] == 0, "REWARD_ALREADY_DISTRIBUTED");

        uint256 totalBlocks = epochManagerContract.totalBlocks(epochId);
        require(totalBlocks != 0, "EPOCH_NOT_COMMITTED");

        uint256 totalSupply = totalBalance();
        uint256 rewardIndex = _calcRewardIndex(totalSupply, epochSize, totalBlocks);
        uint256 length = uptime.length;
        uint256 totalReward = 0;
        for (uint256 i = 0; i < length; ++i) {
            totalReward += _distributeReward(epochId, uptime[i], rewardIndex, totalSupply, totalBlocks);
        }

        distributedRewardPerEpoch[epochId] = totalReward;
    }

    // _______________ Public functions _______________

    function totalBalanceOf(address staker) public view returns (uint256) {
        return stakeOf(staker) + _getStakerDelegatedBalance(staker);
    }

    function totalBalance() public view returns (uint256) {
        return totalStake + _totalDelegation();
    }

    // _______________ Internal functions _______________

    function _stake(address account, uint256 amount) internal override(Staking, LiquidStaking, StateSyncStaking) {
        if (stakeOf(account) == 0) {
            validatorManagerContract.activateValidator(account);
        }

        super._stake(account, amount);
    }

    function _unstake(
        address account,
        uint256 amount
    )
        internal
        override(Staking, LiquidStaking, StateSyncStaking, VestedStaking)
        returns (uint256 stakeLeft, uint256 withdrawAmount)
    {
        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        if (stakeLeft == 0) {
            validatorManagerContract.deactivateValidator(account);
        }
    }

    function _onDelegate(address staker) internal virtual override {
        _syncState(staker);
    }

    function _onUndelegate(address staker) internal virtual override {
        _syncState(staker);
    }

    function _afterPenalizeStakerHook(address staker, uint256 unstakeAmount, uint256 leftForStaker) internal override {
        // the unstake amount of liquid tokens must be paid at the time of withdrawal
        // but only the leftForStaker will be automatically requested,
        // so we have to set the unstake amount - leftForStaker as liquidity debt
        liquidityDebts[staker] += (unstakeAmount - leftForStaker);
        _syncState(staker);
    }

    function _afterWithdrawBannedFundsHook(address staker, uint256 withdrawnAmount) internal virtual override {
        _collectTokens(staker, withdrawnAmount);
    }

    function _claimStakingRewards(address staker) internal override(Staking, VestedStaking) returns (uint256 rewards) {
        return super._claimStakingRewards(staker);
    }

    function _distributeStakingReward(address account, uint256 rewardIndex) internal override(Staking, VestedStaking) {
        return super._distributeStakingReward(account, rewardIndex);
    }

    function _getBalanceToSync(address account) internal virtual override returns (uint256) {
        if (stakeOf(account) == 0) {
            return 0;
        }

        return totalBalanceOf(account);
    }

    // _______________ Private functions _______________

    function _distributeReward(
        uint256 epochId,
        Uptime calldata uptime,
        uint256 fullReward,
        uint256 totalSupply,
        uint256 totalBlocks
    ) private returns (uint256 reward) {
        require(uptime.signedBlocks <= totalBlocks, "SIGNED_BLOCKS_EXCEEDS_TOTAL");

        uint256 totalStake = stakeOf(uptime.validator);
        uint256 commission = _getstakerDelegationCommission(uptime.validator);
        uint256 delegation = _getStakerDelegatedBalance(uptime.validator);
        // slither-disable-next-line divide-before-multiply
        uint256 validatorReward = (fullReward * (totalStake + delegation) * uptime.signedBlocks) /
            (totalSupply * totalBlocks);
        (uint256 validatorShares, uint256 delegatorShares) = _calculateValidatorAndDelegatorShares(
            totalStake,
            delegation,
            validatorReward,
            commission
        );

        _distributeStakingReward(uptime.validator, validatorShares);
        distributeDelegationRewards(uptime.validator, delegatorShares, epochId);

        // Keep history record of the validator rewards to be used on maturing vesting reward claim
        if (validatorShares > 0) {
            _saveStakerRewardData(uptime.validator, epochId);
        }

        return validatorReward;
    }

    function _calculateValidatorAndDelegatorShares(
        uint256 stakedBalance,
        uint256 delegatedBalance,
        uint256 totalReward,
        uint256 commission
    ) private pure returns (uint256, uint256) {
        if (stakedBalance == 0) return (0, 0);
        if (delegatedBalance == 0) return (totalReward, 0);
        uint256 validatorReward = (totalReward * stakedBalance) / (stakedBalance + delegatedBalance);
        uint256 delegatorReward = totalReward - validatorReward;
        uint256 validatorCommission = (commission * delegatorReward) / 100;

        return (validatorReward + validatorCommission, delegatorReward - validatorCommission);
    }

    /**
     * Calculates the epoch reward index.
     * We call it index because it is not the actual reward
     * but only the macroFactor and the blocksCreated/totalEpochBlocks ratio are aplied here.
     * The participation factor is applied later in the distribution process.
     * (base + vesting and RSI are applied on claimReward for delegators
     * and on _distributeValidatorReward for validators)
     * @param activeStake Total active stake for the epoch
     * @param totalBlocks Number of blocks in the epoch
     * @param epochSize Expected size (number of blocks) of the epoch
     */
    function _calcRewardIndex(
        uint256 activeStake,
        uint256 epochSize,
        uint256 totalBlocks
    ) private view returns (uint256) {
        uint256 modifiedEpochReward = aprCalculatorContract.applyMacro(activeStake);

        return (modifiedEpochReward * totalBlocks) / (epochSize);
    }
}
