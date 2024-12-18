// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IWithdrawal} from "../common/Withdrawal/IWithdrawal.sol";

struct StakingReward {
    uint256 taken;
    uint256 total;
}

interface IStaking is IWithdrawal {
    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event StakingRewardsClaimed(address indexed account, uint256 amount);
    event StakingRewardDistributed(address indexed account, uint256 amount);

    error NoRewards();
    error InvalidMinStake();
    error StakeRequirement(string src, string msg);

    /**
     * @notice Stakes sent amount.
     */
    function stake() external payable;

    /**
     * @notice Unstakes amount for sender. Claims rewards beforehand.
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external;

    /**
     * @dev Should be called by the Governance.
     * @notice Changes minimum stake required for stakers.
     * @param newMinStake New minimum stake
     */
    function changeMinStake(uint256 newMinStake) external;

    // _______________ Public functions _______________

    /**
     * @notice Claims staking rewards for the sender.
     */
    function claimStakingRewards() external;

    /**
     * @notice Returns staked amount for the given account.
     * @param account Staker address
     */
    function stakeOf(address account) external view returns (uint256);

    /**
     * @notice Returns unclaimed rewards for the given account.
     * @param account Staker address
     */
    function unclaimedRewards(address account) external view returns (uint256);
}
