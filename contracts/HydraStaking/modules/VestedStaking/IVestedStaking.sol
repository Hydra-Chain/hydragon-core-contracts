// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct StakingRewardsHistory {
    uint256 totalReward;
    uint256 epoch;
    uint256 timestamp;
}

interface IVestedStaking {
    /**
     * @notice Returns historical records of the staking rewards of the user
     * @param staker The address of the staker
     * @return stakingRewardsHistory array with the historical records of the staking rewards of the user
     */
    function getStakingRewardsHistoryValues(address staker) external view returns (StakingRewardsHistory[] memory);

    /**
     * @notice Returns the penalty and reward that will be burned, if vested stake position is active
     * @param staker The address of the staker
     * @param amount The amount that is going to be unstaked
     * @return penalty for the staker
     * @return reward of the staker
     */
    function calcVestedStakingPositionPenalty(
        address staker,
        uint256 amount
    ) external view returns (uint256 penalty, uint256 reward);

    /**
     * @notice Stakes sent amount with vesting period.
     * @param durationWeeks Duration of the vesting in weeks. Must be between 1 and 52.
     */
    function stakeWithVesting(uint256 durationWeeks) external payable;

    /**
     * @notice Claims staking rewards for the sender.
     * @param rewardHistoryIndex The index of the reward history to claim rewards from
     */
    function claimStakingRewards(uint256 rewardHistoryIndex) external;

    /**
     * @notice Calculates the staker's pending (unclaimed) position rewards
     * @param staker The address of the staker
     * @param rewardHistoryIndex The index of the reward history to calculate rewards from
     * @return Pending rewards expected by the vested staker's position (in HYDRA wei)
     */
    function calculatePositionPendingReward(address staker, uint256 rewardHistoryIndex) external view returns (uint256);
}
