// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {System} from "../common/System/System.sol";
import {SafeMathUint} from "./../common/libs/SafeMathUint.sol";
import {Uptime} from "../HydraChain/modules/ValidatorManager/IValidatorManager.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {RewardWalletConnector} from "../RewardWallet/RewardWalletConnector.sol";
import {LiquidStaking} from "./modules/LiquidStaking/LiquidStaking.sol";
import {VestedStaking} from "./modules/VestedStaking/VestedStaking.sol";
import {DelegatedStaking} from "./modules/DelegatedStaking/DelegatedStaking.sol";
import {StateSyncStaking} from "./modules/StateSyncStaking/StateSyncStaking.sol";
import {PenalizeableStaking} from "./modules/PenalizeableStaking/PenalizeableStaking.sol";
import {IHydraStaking, StakerInit} from "./IHydraStaking.sol";
import {Staking} from "./Staking.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

contract HydraStaking is
    IHydraStaking,
    System,
    HydraChainConnector,
    RewardWalletConnector,
    Staking,
    VestedStaking,
    StateSyncStaking,
    LiquidStaking,
    PenalizeableStaking,
    DelegatedStaking
{
    using SafeMathUint for uint256;

    uint256 public lastDistribution; // last rewards distribution timestamp
    /// @notice Mapping used to keep the paid rewards per epoch
    mapping(uint256 => uint256) public distributedRewardPerEpoch;

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by Hydra client at genesis to set up the initial set.
     * @dev only callable by client, can only be called once
     */
    function initialize(
        StakerInit[] calldata initialStakers,
        address governance,
        uint256 newMinStake,
        address newLiquidToken,
        address hydraChainAddr,
        address aprCalculatorAddr,
        address hydraDelegationAddr,
        address rewardWalletAddr
    ) external initializer onlySystemCall {
        __HydraChainConnector_init(hydraChainAddr);
        __Staking_init(newMinStake, aprCalculatorAddr, rewardWalletAddr, governance);
        __LiquidStaking_init(newLiquidToken);
        __DelegatedStaking_init(hydraDelegationAddr);

        _initialize(initialStakers);
    }

    function _initialize(StakerInit[] calldata initialStakers) private {
        lastDistribution = block.timestamp;
        // the amount of stake for all initial stakers will be send as hydra to the contract from the node
        uint256 length = initialStakers.length;
        for (uint256 i = 0; i < length; i++) {
            _stake(initialStakers[i].addr, initialStakers[i].stake);
        }
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IHydraStaking
     */
    function distributeRewardsFor(uint256 epochId, Uptime[] calldata uptime) external onlySystemCall {
        if (distributedRewardPerEpoch[epochId] != 0) {
            revert DistributeRewardFailed("REWARD_ALREADY_DISTRIBUTED");
        }

        uint256 totalBlocks = hydraChainContract.totalBlocks(epochId);
        if (totalBlocks == 0) {
            revert DistributeRewardFailed("NO_BLOCKS_COMMITTED");
        }

        uint256 totalSupply = totalBalance();
        uint256 rewardIndex = _calcRewardIndex(totalSupply);
        lastDistribution = block.timestamp;

        uint256 length = uptime.length;
        uint256 totalReward = 0;
        for (uint256 i = 0; i < length; ++i) {
            totalReward += _distributeReward(epochId, uptime[i], rewardIndex, totalSupply, totalBlocks);
        }

        distributedRewardPerEpoch[epochId] = totalReward;
    }

    /**
     * @inheritdoc IHydraStaking
     */
    function temporaryEjectValidator(address account) external onlyHydraChain {
        emit BalanceChanged(account, 0);
    }

    /**
     * @inheritdoc IHydraStaking
     */
    function recoverEjectedValidator(address account) external onlyHydraChain {
        _syncState(account);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IHydraStaking
     */
    function totalBalanceOf(address staker) public view returns (uint256) {
        return stakeOf(staker) + _getStakerDelegatedBalance(staker);
    }

    /**
     * @inheritdoc IHydraStaking
     */
    function totalBalance() public view returns (uint256) {
        return totalStake + _totalDelegation();
    }

    // _______________ Internal functions _______________

    /**
     * @inheritdoc Staking
     */
    function _stake(address account, uint256 amount) internal override(Staking, LiquidStaking, StateSyncStaking) {
        if (stakeOf(account) == 0) {
            hydraChainContract.activateValidator(account);
        }

        super._stake(account, amount);
    }

    /**
     * @inheritdoc Staking
     */
    function _unstake(
        address account,
        uint256 amount
    )
        internal
        override(Staking, VestedStaking, StateSyncStaking, LiquidStaking)
        returns (uint256 stakeLeft, uint256 withdrawAmount)
    {
        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        if (stakeLeft == 0) {
            hydraChainContract.deactivateValidator(account);
        }
    }

    /**
     * @inheritdoc DelegatedStaking
     */
    function _onDelegate(address staker) internal virtual override {
        _syncState(staker);
    }

    /**
     * @inheritdoc DelegatedStaking
     */
    function _onUndelegate(address staker) internal virtual override {
        _syncState(staker);
    }

    function _executeUnstake(
        address staker,
        uint256 unstakeAmount
    ) internal virtual override returns (uint256 stakeLeft, uint256 withdrawAmount) {
        // this will call only StateSyncStaking._unstake(), VestedStaking._unstake() and staking._unstake()
        // because this is the order in the Linearization of the inheritance graph
        return StateSyncStaking._unstake(staker, unstakeAmount);
    }

    /**
     * @inheritdoc PenalizeableStaking
     */
    function _afterPenalizeStakerHook(address staker, uint256 unstakeAmount, uint256 leftForStaker) internal override {
        // the unstake amount of liquid tokens must be paid at the time of withdrawal
        // but only the leftForStaker will be automatically requested,
        // so we have to set the unstake amount - leftForStaker as liquidity debt
        liquidityDebts[staker] += (unstakeAmount - leftForStaker).toInt256Safe();
        _syncState(staker);
    }

    /**
     * @inheritdoc PenalizeableStaking
     */
    function _afterWithdrawBannedFundsHook(address staker, uint256 withdrawnAmount) internal virtual override {
        _collectTokens(staker, withdrawnAmount);
    }

    /**
     * @notice Claims the staking rewards for the staker.
     * @param staker The staker to claim the rewards for
     */
    function _claimStakingRewards(address staker) internal override(Staking, VestedStaking) returns (uint256 rewards) {
        return super._claimStakingRewards(staker);
    }

    /**
     * @notice Distributes the staking rewards for the staker.
     * @param account The account to distribute the rewards for
     * @param rewardIndex The reward index to distribute
     */
    function _distributeStakingReward(address account, uint256 rewardIndex) internal override(Staking, VestedStaking) {
        return super._distributeStakingReward(account, rewardIndex);
    }

    /**
     * @notice Syncs the state of the staker.
     * @dev Checks if the staker has no stake
     * @param account The staker to sync the state for
     */
    function _getBalanceToSync(address account) internal virtual override returns (uint256) {
        if (stakeOf(account) == 0) {
            return 0;
        }

        return totalBalanceOf(account);
    }

    // _______________ Private functions _______________

    /**
     * @notice Distributes the reward for the given staker.
     * @notice Validator won't receive a reward in the epoch of exiting his position (stake becomes 0). His delegators will receive a reward for his uptime.
     * @param epochId The epoch id
     * @param uptime The uptime data for the validator (staker)
     * @param fullRewardIndex The full reward index
     * (index because only part of the reward calculations are applied at that point) for the epoch
     * @param totalSupply The total supply for the epoch
     * @param totalBlocks The total blocks for the epoch
     */
    function _distributeReward(
        uint256 epochId,
        Uptime calldata uptime,
        uint256 fullRewardIndex,
        uint256 totalSupply,
        uint256 totalBlocks
    ) private returns (uint256 reward) {
        if (uptime.signedBlocks > totalBlocks) {
            revert DistributeRewardFailed("SIGNED_BLOCKS_EXCEEDS_TOTAL");
        }

        uint256 stake = stakeOf(uptime.validator);
        uint256 delegation = _getStakerDelegatedBalance(uptime.validator);
        uint256 commission = _getStakerDelegationCommission(uptime.validator);
        // slither-disable-next-line divide-before-multiply
        uint256 stakerRewardIndex = (fullRewardIndex * (stake + delegation) * uptime.signedBlocks) /
            (totalSupply * totalBlocks);
        (uint256 stakerShares, uint256 delegatorShares) = _calculateStakerAndDelegatorShares(
            stake,
            delegation,
            stakerRewardIndex,
            commission
        );

        _distributeStakingReward(uptime.validator, stakerShares);
        _distributeDelegationRewards(uptime.validator, delegatorShares, epochId);

        // Keep history record of the staker rewards to be used on maturing vesting reward claim
        if (stakerShares > 0) {
            _saveStakerRewardData(uptime.validator, epochId);
        }

        return stakerRewardIndex;
    }

    /**
     * @notice Calculates the staker and delegator shares.
     * @param stakedBalance The staked balance
     * @param delegatedBalance The delegated balance
     * @param totalReward The total reward
     * @param commission The commission of the staker
     */
    function _calculateStakerAndDelegatorShares(
        uint256 stakedBalance,
        uint256 delegatedBalance,
        uint256 totalReward,
        uint256 commission
    ) private pure returns (uint256, uint256) {
        if (stakedBalance == 0) return (0, totalReward);
        if (delegatedBalance == 0) return (totalReward, 0);
        uint256 stakerReward = (totalReward * stakedBalance) / (stakedBalance + delegatedBalance);
        uint256 delegatorReward = totalReward - stakerReward;
        uint256 stakerCommission = (commission * delegatorReward) / 100;

        return (stakerReward + stakerCommission, delegatorReward - stakerCommission);
    }

    /**
     * Calculates the epoch reward index.
     * We call it index because it is not the actual reward
     * but only the macroFactor and the "time passed from last distribution / 365 days ratio" are aplied here.
     * we need to apply the ration because all APR params are yearly
     * but we distribute rewards only for the time that has passed from last distribution.
     * The participation factor is applied later in the distribution process.
     * (base + vesting and RSI are applied on claimReward for delegators
     * and on _distributeValidatorReward for stakers)
     * @param activeStake Total active stake for the epoch
     */
    function _calcRewardIndex(uint256 activeStake) private view returns (uint256) {
        return ((aprCalculatorContract.applyMacro(activeStake)) * (block.timestamp - lastDistribution)) / 365 days;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
