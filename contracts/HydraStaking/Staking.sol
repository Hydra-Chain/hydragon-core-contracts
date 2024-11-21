// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Unauthorized} from "../common/Errors.sol";
import {Governed} from "../common/Governed/Governed.sol";
import {Withdrawal} from "../common/Withdrawal/Withdrawal.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {RewardWalletConnector} from "../RewardWallet/RewardWalletConnector.sol";
import {IStaking, StakingReward} from "./IStaking.sol";

contract Staking is IStaking, Governed, Withdrawal, HydraChainConnector, APRCalculatorConnector, RewardWalletConnector {
    /// @notice A constant for the minimum stake limit
    uint256 public constant MIN_STAKE_LIMIT = 1 ether;

    /// @notice A state variable to keep the minimum amount of stake
    uint256 public minStake;
    uint256 public totalStake;
    mapping(address => uint256) public stakes;
    /// @notice The staking rewards mapped to a staker's address
    mapping(address => StakingReward) public stakingRewards;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Staking_init(
        uint256 _newMinStake,
        address _aprCalculatorAddr,
        address _rewardWalletAddr,
        address _hydraChainAddr,
        address _governance
    ) internal onlyInitializing {
        __Governed_init(_governance);
        __Withdrawal_init();
        __HydraChainConnector_init(_hydraChainAddr);
        __APRCalculatorConnector_init(_aprCalculatorAddr);
        __RewardWalletConnector_init(_rewardWalletAddr);
        __Staking_init_unchained(_newMinStake);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Staking_init_unchained(uint256 _newMinStake) internal onlyInitializing {
        _changeMinStake(_newMinStake);
    }

    // _______________ Modifiers _______________

    /**
     * @notice Modifier that checks if the staker meets the current min-stake.
     * @dev This state is determined by the minimum stake required. If the min stake is increased,
     * The staker needs to meet the new min stake requirement so he can continue having new delegators or top up delegations.
     */
    modifier onlyActiveStaker(address staker) {
        if (stakeOf(staker) < minStake) {
            revert Unauthorized("INACTIVE_STAKER");
        }

        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IStaking
     */
    function stake() external payable {
        _stake(msg.sender, msg.value);
    }

    /**
     * @inheritdoc IStaking
     */
    function unstake(uint256 amount) external {
        (, uint256 withdrawAmount) = _unstake(msg.sender, amount);
        _registerWithdrawal(msg.sender, withdrawAmount);
    }

    /**
     * @inheritdoc IStaking
     */
    function changeMinStake(uint256 newMinStake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _changeMinStake(newMinStake);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IStaking
     */
    function claimStakingRewards() public {
        rewardWalletContract.distributeReward(msg.sender, _claimStakingRewards(msg.sender));
    }

    /**
     * @inheritdoc IStaking
     */
    function stakeOf(address account) public view returns (uint256) {
        return stakes[account];
    }

    /**
     * @inheritdoc IStaking
     */
    function unclaimedRewards(address account) public view returns (uint256) {
        return stakingRewards[account].total - stakingRewards[account].taken;
    }

    // _______________ Internal functions _______________

    /**
     * @notice Function that stakes the given amount for the given account.
     * @dev This is virtual to allow the inheriting contracts to override the stake function.
     * @param account The account to stake for
     * @param amount The amount to stake
     */
    function _stake(address account, uint256 amount) internal virtual {
        if (_isBanInitiated(account)) revert Unauthorized("BAN_INITIATED");

        uint256 currentBalance = stakeOf(account);
        if (amount + currentBalance < minStake) revert StakeRequirement({src: "stake", msg: "STAKE_TOO_LOW"});

        stakes[account] += amount;
        totalStake += amount;

        emit Staked(account, amount);
    }

    /**
     * @notice Function that unstakes the given amount for the given account.
     * @dev This is virtual to allow the inheriting contracts to override the unstake function.
     * @param account The account to unstake for
     * @param amount The amount to unstake
     */
    function _unstake(
        address account,
        uint256 amount
    ) internal virtual returns (uint256 stakeLeft, uint256 withdrawAmount) {
        if (_isBanInitiated(account)) revert Unauthorized("BAN_INITIATED");

        uint256 accountStake = stakeOf(account);
        if (amount > accountStake) revert StakeRequirement({src: "unstake", msg: "INSUFFICIENT_BALANCE"});

        unchecked {
            stakeLeft = accountStake - amount;
        }

        if (stakeLeft < minStake && stakeLeft != 0) revert StakeRequirement({src: "unstake", msg: "STAKE_TOO_LOW"});

        stakes[account] = stakeLeft;
        totalStake -= amount;
        withdrawAmount = amount;

        emit Unstaked(account, amount);
    }

    /**
     * @notice Function that calculates the end reward for a user (without vesting bonuses) based on the pool reward index.
     * @dev Denominator is used because we should work with floating-point numbers
     * @param rewardIndex index The reward index that we apply the base APR to
     * @dev The reward with the applied APR
     */
    function _distributeStakingReward(address account, uint256 rewardIndex) internal virtual {
        uint256 reward = aprCalculatorContract.applyBaseAPR(rewardIndex);
        stakingRewards[account].total += reward;

        emit StakingRewardDistributed(account, reward);
    }

    /**
     * @notice Function that claims the staking rewards for the given account.
     * @dev This is virtual to allow the inheriting contracts to override the claimStakingRewards function.
     * @param staker The account to claim the rewards for
     * @return rewards The amount of rewards claimed
     */
    function _claimStakingRewards(address staker) internal virtual returns (uint256 rewards) {
        rewards = unclaimedRewards(staker);
        if (rewards == 0) revert NoRewards();

        stakingRewards[staker].taken += rewards;

        emit StakingRewardsClaimed(staker, rewards);
    }

    /**
     * @notice Check if the ban is initiated for the given account
     * @param account The address of the account
     */
    function _isBanInitiated(address account) internal view returns (bool) {
        return hydraChainContract.banIsInitiated(account);
    }

    // _______________ Private functions _______________

    /**
     * @notice Function that changes the minimum stake required for stakers.
     * @param newMinStake The new minimum stake
     */
    function _changeMinStake(uint256 newMinStake) private {
        if (newMinStake < MIN_STAKE_LIMIT) revert InvalidMinStake();
        minStake = newMinStake;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
