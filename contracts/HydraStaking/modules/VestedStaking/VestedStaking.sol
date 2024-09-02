// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {VestedPositionLib} from "../../../common/Vesting/VestedPositionLib.sol";
import {VestingPosition} from "../../../common/Vesting/IVesting.sol";
import {Vesting} from "../../../common/Vesting/Vesting.sol";
import {Staking} from "../../Staking.sol";
import {IVestedStaking, StakingRewardsHistory} from "./IVestedStaking.sol";

/**
 * @title VestedStaking
 * @notice An extension of the Staking contract that enables vesting the stake for a higher APY
 */
abstract contract VestedStaking is IVestedStaking, Staking, Vesting {
    using VestedPositionLib for VestingPosition;

    /**
     * @notice The stakers' vesting positions
     */
    mapping(address => VestingPosition) public vestedStakingPositions;
    /**
     * @notice Keeps the rewards history of the stakers
     */
    mapping(address => StakingRewardsHistory[]) public stakingRewardsHistory;

    // _______________ Initializer _______________

    function __VestedStaking_init() internal {}

    // _______________ External functions _______________

    /**
     * @inheritdoc IVestedStaking
     */
    function getStakingRewardsHistoryValues(address staker) external view returns (StakingRewardsHistory[] memory) {
        return stakingRewardsHistory[staker];
    }

    /**
     * @inheritdoc IVestedStaking
     */
    function calcVestedStakingPositionPenalty(
        address staker,
        uint256 amount
    ) external view returns (uint256 penalty, uint256 reward) {
        reward = stakingRewards[staker].total - stakingRewards[staker].taken;
        VestingPosition memory position = vestedStakingPositions[staker];
        if (position.isActive()) {
            penalty = _calcPenalty(position, amount);
            // if active position, reward is burned
            reward = 0;
        }
    }

    /**
     * @inheritdoc IVestedStaking
     */
    function stakeWithVesting(uint256 durationWeeks) external payable {
        if (vestedStakingPositions[msg.sender].isInVestingCycle()) {
            revert StakeRequirement({src: "stakeWithVesting", msg: "ALREADY_IN_VESTING_CYCLE"});
        }

        uint256 duration = durationWeeks * 1 weeks;
        vestedStakingPositions[msg.sender] = VestingPosition({
            duration: duration,
            start: block.timestamp,
            end: block.timestamp + duration,
            base: aprCalculatorContract.getBaseAPR(),
            vestBonus: aprCalculatorContract.getVestingBonus(durationWeeks),
            rsiBonus: uint248(aprCalculatorContract.getRSIBonus())
        });

        _stake(msg.sender, msg.value);
    }

    /**
     * @inheritdoc IVestedStaking
     */
    function claimStakingRewards(uint256 rewardHistoryIndex) external {
        if (!vestedStakingPositions[msg.sender].isMaturing()) {
            revert StakeRequirement({src: "vesting", msg: "NOT_MATURING"});
        }

        uint256 rewards = _calcStakingRewards(msg.sender, rewardHistoryIndex);
        if (rewards == 0) revert NoRewards();

        stakingRewards[msg.sender].taken += rewards;

        rewardWalletContract.distributeReward(msg.sender, rewards);

        emit StakingRewardsClaimed(msg.sender, rewards);
    }

    /**
     * @inheritdoc IVestedStaking
     */
    function calculateExpectedPositionReward(
        address staker,
        uint256 rewardHistoryIndex
    ) external view returns (uint256) {
        StakingRewardsHistory memory rewardData = stakingRewardsHistory[staker][rewardHistoryIndex];

        if (rewardData.totalReward > stakingRewards[staker].taken) {
            return rewardData.totalReward - stakingRewards[staker].taken;
        }

        return 0;
    }

    // _______________ Internal functions _______________

    /**
     * @notice Unstakes the given amount for the given account
     * @param account The account to unstake for
     * @param amount The amount to unstake
     */
    function _unstake(
        address account,
        uint256 amount
    ) internal virtual override returns (uint256 stakeLeft, uint256 withdrawAmount) {
        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        VestingPosition memory position = vestedStakingPositions[account];
        if (position.isActive()) {
            // staker lose its reward
            stakingRewards[account].taken = stakingRewards[account].total;
            uint256 penalty = _calcPenalty(position, amount);

            if (stakeLeft == 0) {
                // if position is closed when active, we delete all the vesting data
                // that way allowing the user to open new position for the same staker with the same vesting manager
                delete vestedStakingPositions[account];
            }

            // Burn penalty
            _burnAmount(penalty);

            return (stakeLeft, withdrawAmount - penalty);
        }

        return (stakeLeft, withdrawAmount);
    }

    /**
     * @notice Function that claims the staking rewards for the given account
     * @param staker The account to claim the rewards for
     * @return rewards The amount of rewards claimed
     */
    function _claimStakingRewards(address staker) internal virtual override returns (uint256 rewards) {
        if (vestedStakingPositions[staker].isInVestingCycle()) {
            revert NoRewards();
        }

        return super._claimStakingRewards(staker);
    }

    /**
     * @notice Distributes the staking rewards for the given account
     * @param account The account to distribute the rewards for
     * @param rewardIndex The index of the reward to distribute
     */
    function _distributeStakingReward(address account, uint256 rewardIndex) internal virtual override {
        VestingPosition memory position = vestedStakingPositions[account];
        if (position.isActive()) {
            uint256 reward = _applyVestingAPR(position, rewardIndex);
            stakingRewards[account].total += reward;

            emit StakingRewardDistributed(account, reward);

            return;
        }

        return super._distributeStakingReward(account, rewardIndex);
    }

    /**
     * @notice Calculates the staking rewards for the given account
     * @dev Ensure the function is executed for maturing positions only
     * @param account The account to calculate the rewards for
     * @param rewardHistoryIndex The index of the reward history
     * @return The amount of rewards
     */
    function _calcStakingRewards(address account, uint256 rewardHistoryIndex) internal view returns (uint256) {
        VestingPosition memory position = vestedStakingPositions[account];
        uint256 maturedPeriod = block.timestamp - position.end;
        uint256 alreadyMatured = position.start + maturedPeriod;
        StakingRewardsHistory memory rewardData = stakingRewardsHistory[account][rewardHistoryIndex];
        // If the given data is for still not matured period - it is wrong, so revert
        if (rewardData.timestamp > alreadyMatured) {
            revert StakeRequirement({src: "stakerVesting", msg: "WRONG_DATA"});
        }

        if (rewardData.totalReward > stakingRewards[account].taken) {
            return rewardData.totalReward - stakingRewards[account].taken;
        }

        return 0;
    }

    /**
     * @notice Saves the staker reward data
     * @param staker The staker to save the data for
     * @param epoch The epoch to save the data for
     */
    function _saveStakerRewardData(address staker, uint256 epoch) internal {
        StakingRewardsHistory memory rewardData = StakingRewardsHistory({
            totalReward: stakingRewards[staker].total,
            epoch: epoch,
            timestamp: block.timestamp
        });

        stakingRewardsHistory[staker].push(rewardData);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
