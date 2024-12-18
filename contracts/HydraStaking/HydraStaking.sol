// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {SafeMathUint} from "./../common/libs/SafeMathUint.sol";
import {VestingPosition} from "../common/Vesting/IVesting.sol";
import {Uptime} from "../HydraChain/modules/ValidatorManager/IValidatorManager.sol";
import {RewardWalletConnector} from "../RewardWallet/RewardWalletConnector.sol";
import {LiquidStaking} from "./modules/LiquidStaking/LiquidStaking.sol";
import {VestedStaking} from "./modules/VestedStaking/VestedStaking.sol";
import {DelegatedStaking} from "./modules/DelegatedStaking/DelegatedStaking.sol";
import {StateSyncStaking} from "./modules/StateSyncStaking/StateSyncStaking.sol";
import {PenalizeableStaking} from "./modules/PenalizeableStaking/PenalizeableStaking.sol";
import {IHydraStaking, StakerInit} from "./IHydraStaking.sol";
import {Staking, IStaking} from "./Staking.sol";

contract HydraStaking is
    IHydraStaking,
    System,
    RewardWalletConnector,
    Staking,
    VestedStaking,
    StateSyncStaking,
    LiquidStaking,
    PenalizeableStaking,
    DelegatedStaking
{
    using SafeMathUint for uint256;

    /// @notice last rewards distribution timestamp
    uint256 public lastDistribution;
    /// @notice Mapping used to keep the paid rewards per epoch
    mapping(uint256 => uint256) public distributedRewardPerEpoch;

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by Hydra client at genesis to set up the initial set.
     * @dev only callable by client, can only be called once
     */
    function initialize(
        StakerInit[] calldata initialStakers,
        uint256 newMinStake,
        address governance,
        address aprCalculatorAddr,
        address hydraChainAddr,
        address hydraDelegationAddr,
        address rewardWalletAddr,
        address liquidToken
    ) external initializer onlySystemCall {
        __Staking_init(newMinStake, governance, aprCalculatorAddr, hydraChainAddr, rewardWalletAddr);
        __DelegatedStaking_init_unchained(hydraDelegationAddr);
        __Liquid_init(liquidToken);
        __Vesting_init_unchained();

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
     * @notice Stakes the sent amount.
     * @dev Reverts if we have an active position for the staker.
     */
    function stake() public payable override(IStaking, Staking, VestedStaking) {
        super.stake();
    }

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
     * @notice Check if the ban is initiated for the given account
     * @param account The address of the account
     */
    function _isBanInitiated(address account) internal view returns (bool) {
        return hydraChainContract.banIsInitiated(account);
    }

    /**
     * @inheritdoc Staking
     */
    function _stake(address account, uint256 amount) internal override(Staking, LiquidStaking, StateSyncStaking) {
        if (_isBanInitiated(account)) revert Unauthorized("BAN_INITIATED");

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
        if (_isBanInitiated(account)) revert Unauthorized("BAN_INITIATED");

        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        if (stakeLeft == 0) {
            hydraChainContract.deactivateValidator(account);
        }
    }

    /**
     * @inheritdoc DelegatedStaking
     */
    function _onDelegate(address staker) internal virtual override {
        if (!_isBanInitiated(staker)) {
            _syncState(staker);
        }
    }

    /**
     * @inheritdoc DelegatedStaking
     */
    function _onUndelegate(address staker) internal virtual override {
        if (!_isBanInitiated(staker)) {
            _syncState(staker);
        }
    }

    function _executeUnstake(
        address staker,
        uint256 unstakeAmount
    ) internal virtual override returns (uint256 stakeLeft, uint256 withdrawAmount) {
        // this will call only StateSyncStaking._unstake(), VestedStaking._unstake() and Staking._unstake()
        // because this is the order in the Linearization of the inheritance graph
        return StateSyncStaking._unstake(staker, unstakeAmount);
    }

    /**
     * @inheritdoc PenalizeableStaking
     */
    function _afterPenalizeStakerHook(address staker, uint256 unstakeAmount, uint256 leftForStaker) internal override {
        // the unstake amount of liquid tokens must be paid at the time of initiatePenalizedFundsWithdrawal
        // but only the leftForStaker will be automatically requested,
        // so we have to set the unstake amount - leftForStaker as liquidity debt that must be paid as well
        liquidityDebts[staker] += (unstakeAmount - leftForStaker).toInt256Safe();
        // the generated rewards for the staker must be taken (if is active position, rewards will be already taken)
        stakingRewards[staker].taken = stakingRewards[staker].total;
    }

    /**
     * @inheritdoc PenalizeableStaking
     */
    function _afterInitiatePenalizedFundsWithdrawal(address staker, uint256 withdrawnAmount) internal virtual override {
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
     * This function is called to distribute tokens to a staker. If the staker is opening a vested position,
     * the amount of liquid tokens distributed is decreased based on the vesting duration. Specifically, the amount is
     * reduced by a percentage per week of vesting. The corresponding negative debt is also added to the account's liquidity debts,
     * ensuring that the user must return the appropriate decreased amount.
     */
    function _distributeTokens(address staker, uint256 amount) internal virtual override {
        VestingPosition memory position = vestedStakingPositions[staker];
        // This check works because if position has already been opened, the restrictions on stake() and stakeWithVesting()
        // will prevent entering the check again
        if (_isOpeningPosition(position)) {
            uint256 previousStake = stakeOf(staker) - amount;
            if (previousStake != 0) {
                // We want all previously distributed tokens to be collected,
                // because for vested positions we distribute decreased amount of liquid tokens
                _collectTokens(staker, previousStake);
                amount += previousStake;
            }

            uint256 debt = _calculatePositionDebt(amount, position.duration);
            liquidityDebts[staker] -= debt.toInt256Safe(); // Add negative debt
            amount -= debt;
        }

        super._distributeTokens(staker, amount);
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
     * @notice Validator won't receive a reward in the epoch of exiting the staking (stake becomes 0). His delegators will receive a reward for his uptime.
     * @param epochId The epoch id
     * @param uptime The uptime data for the validator (staker)
     * @param fullRewardIndex The full reward index
     * (index because only part of the reward calculations are applied at that point) for the epoch
     * @param totalSupply The total supply for the epoch
     * @param totalBlocks The total blocks for the epoch
     */
    function _distributeReward(
        uint256 epochId,
        Uptime memory uptime,
        uint256 fullRewardIndex,
        uint256 totalSupply,
        uint256 totalBlocks
    ) private returns (uint256 reward) {
        if (uptime.signedBlocks > totalBlocks) {
            uptime.signedBlocks = totalBlocks;
        }

        uint256 currentStake = stakeOf(uptime.validator);
        uint256 delegation = _getStakerDelegatedBalance(uptime.validator);
        // slither-disable-next-line divide-before-multiply
        uint256 stakerRewardIndex = (fullRewardIndex * (currentStake + delegation) * uptime.signedBlocks) /
            (totalSupply * totalBlocks);
        (uint256 stakerShares, uint256 delegatorShares) = _calculateStakerAndDelegatorShares(
            currentStake,
            delegation,
            stakerRewardIndex
        );

        if (stakerShares != 0) {
            _distributeStakingReward(uptime.validator, stakerShares);
            // Keep history record of the staker rewards to be used on maturing vesting reward claim
            _saveStakerRewardData(uptime.validator, epochId);
        }

        if (delegatorShares != 0) {
            _distributeDelegationRewards(uptime.validator, delegatorShares, epochId);
        }

        return stakerRewardIndex;
    }

    /**
     * @notice Calculates the staker and delegator shares.
     * @param stakedBalance The staked balance
     * @param delegatedBalance The delegated balance
     * @param totalReward The total reward
     */
    function _calculateStakerAndDelegatorShares(
        uint256 stakedBalance,
        uint256 delegatedBalance,
        uint256 totalReward
    ) private pure returns (uint256, uint256) {
        // first check if delegated balance is zero
        // otherwise if both staked and delegated are zero = reward will be lost
        if (delegatedBalance == 0) return (totalReward, 0);
        if (stakedBalance == 0) return (0, totalReward);
        uint256 stakerReward = (totalReward * stakedBalance) / (stakedBalance + delegatedBalance);
        uint256 delegatorReward = totalReward - stakerReward;

        return (stakerReward, delegatorReward);
    }

    /**
     * Calculates the epoch reward index.
     * We call it index because it is not the actual reward
     * but only the macroFactor and the "time passed from last distribution / 365 days ratio" are applied here.
     * we need to apply the ratio because all APR params are yearly
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
