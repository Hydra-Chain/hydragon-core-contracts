// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "./../common/Governed/Governed.sol";
import {Withdrawal} from "./../common/Withdrawal/Withdrawal.sol";
import {APRCalculatorConnector} from "./../APRCalculator/APRCalculatorConnector.sol";
import {EpochManagerConnector} from "./../HydraChain/modules/EpochManager/EpochManagerConnector.sol";
import {Unauthorized} from "./../common/Errors.sol";
import {IStaking, StakingReward} from "./IStaking.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

contract Staking is IStaking, Governed, Withdrawal, APRCalculatorConnector, EpochManagerConnector {
    /// @notice A constant for the minimum stake limit
    uint256 public constant MIN_STAKE_LIMIT = 1 ether;

    /// @notice A state variable to keep the minimum amount of stake
    uint256 public minStake;
    uint256 public totalStake;
    mapping(address => uint256) public stakes;
    /// @notice The staking rewards mapped to a staker's address
    mapping(address => StakingReward) public stakingRewards;

    // _______________ Initializer _______________

    function __Staking_init(uint256 newMinStake) internal onlyInitializing {
        __Staking_init_unchained(newMinStake);
    }

    function __Staking_init_unchained(uint256 newMinStake) internal onlyInitializing {
        _changeMinStake(newMinStake);
    }

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
        _unstake(msg.sender, amount);
        _registerWithdrawal(msg.sender, amount);
    }

    /**
     * @inheritdoc IStaking
     */
    function changeMinStake(uint256 newMinStake) external onlyOwner {
        _changeMinStake(newMinStake);
    }

    // _______________ Public functions _______________

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

    /**
     * @inheritdoc IStaking
     */
    function claimStakingRewards() public {
        _withdraw(msg.sender, _claimStakingRewards(msg.sender));
    }

    // _______________ Internal functions _______________

    /**
     * @notice Function that stakes the given amount for the given account.
     * @dev This is virtual to allow the inheriting contracts to override the stake function.
     * @param account The account to stake for
     * @param amount The amount to stake
     */
    function _stake(address account, uint256 amount) internal virtual {
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
        uint256 accountStake = stakeOf(account);
        if (amount > accountStake) revert StakeRequirement({src: "unstake", msg: "INSUFFICIENT_BALANCE"});

        stakeLeft = accountStake - amount;
        if (stakeLeft < minStake && stakeLeft != 0) revert StakeRequirement({src: "unstake", msg: "STAKE_TOO_LOW"});

        stakes[account] = stakeLeft;
        totalStake -= amount;
        withdrawAmount = amount;

        emit Unstaked(msg.sender, amount);
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

    // _______________ Private functions _______________

    /**
     * @notice Function that changes the minimum stake required for validators.
     * @param newMinStake The new minimum stake
     */
    function _changeMinStake(uint256 newMinStake) private {
        if (newMinStake < MIN_STAKE_LIMIT) revert InvalidMinStake();
        minStake = newMinStake;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
