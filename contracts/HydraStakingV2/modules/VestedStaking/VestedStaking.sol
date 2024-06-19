// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {IVestedStaking, StakingRewardsHistory} from "./IVestedStaking.sol";
import {VestingPosition} from "./IVesting.sol";
import {APRCalculatorConnector} from "./../APRCalculatorConnector.sol";
import {VestedPositionLib} from "./VestedPositionLib.sol";

/**
 * @title VestedStaking
 * @notice An extension of the Staking contract that enables vesting the stake for a higher APY
 */
contract VestedStaking is IVestedStaking, APRCalculatorConnector, Staking {
    using VestedPositionLib for VestingPosition;

    /**
     * @notice A constant for the calculation of the weeks left of a vesting period
     * @dev Representing a week in seconds - 1
     */
    uint256 private constant WEEK_MINUS_SECOND = 604799;

    /**
     * @notice The stakers' vesting positions
     */
    mapping(address => VestingPosition) public vestedStakingPositions;
    /**
     * @notice Keeps the rewards history of the validators
     */
    mapping(address => StakingRewardsHistory[]) public stakingRewardsHistory;

    // _______________ Initializer _______________

    // _______________ External functions _______________

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
            penalty = _calcSlashing(position, amount);
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
            vestBonus: aprCalculatorContract.calcVestingBonus(durationWeeks),
            rsiBonus: uint248(aprCalculatorContract.getRSIBonus())
        });

        _stake(msg.sender, msg.value);
    }

    function claimStakingRewards(uint256 rewardHistoryIndex) external {
        if (!vestedStakingPositions[msg.sender].isMaturing()) {
            revert StakeRequirement({src: "vesting", msg: "NOT_MATURING"});
        }

        uint256 rewards = _calcStakingRewards(msg.sender, rewardHistoryIndex);
        if (rewards == 0) revert NoRewards();

        stakingRewards[msg.sender].taken += rewards;

        emit StakingRewardsClaimed(msg.sender, rewards);

        _withdraw(msg.sender, rewards);
    }

    // _______________ Internal functions _______________

    function _unstake(
        address account,
        uint256 amount
    ) internal virtual override returns (uint256 stakeLeft, uint256 withdrawAmount) {
        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        VestingPosition memory position = vestedStakingPositions[account];
        if (position.isActive()) {
            // staker lose its reward
            stakingRewards[account].taken = stakingRewards[account].total;
            uint256 penalty = _calcSlashing(position, amount);
            // if position is closed when active, we delete all the vesting data
            if (stakeLeft == 0) {
                // TODO: Why do we have to delete the vested staking data when we would add it again when new positions is made
                //  and it can cost less if the data is changed instead of newly created
                delete vestedStakingPositions[account];
            }

            // TODO: Burn penalty

            return (stakeLeft, withdrawAmount - penalty);
        }

        return (stakeLeft, withdrawAmount);
    }

    function _claimStakingRewards(address staker) internal virtual override returns (uint256 rewards) {
        if (vestedStakingPositions[staker].isInVestingCycle()) {
            revert NoRewards();
        }

        return super._claimStakingRewards(staker);
    }

    function _distributeStakingReward(address account, uint256 rewardIndex) internal virtual override {
        VestingPosition memory position = vestedStakingPositions[account];
        if (position.isActive()) {
            uint256 reward = _applyCustomAPR(position, rewardIndex, true);
            stakingRewards[account].total += reward;

            emit StakingRewardDistributed(account, reward);

            return;
        }

        return super._distributeStakingReward(account, rewardIndex);
    }

    function _saveStakingRewardsData(address account, uint256 epoch) internal {
        StakingRewardsHistory memory rewardData = StakingRewardsHistory({
            totalReward: stakingRewards[account].total,
            epoch: epoch,
            timestamp: block.timestamp
        });

        stakingRewardsHistory[account].push(rewardData);
    }

    /**
     * @dev Ensure the function is executed for maturing positions only
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
     * @notice Calculates what part of the provided amount of tokens to be slashed
     * @param amount Amount of tokens to be slashed
     * @dev Invoke only when position is active, otherwise - underflow
     */
    function _calcSlashing(VestingPosition memory position, uint256 amount) internal view returns (uint256) {
        uint256 leftPeriod = position.end - block.timestamp;
        uint256 leftWeeks = (leftPeriod + WEEK_MINUS_SECOND) / 1 weeks;
        uint256 bps = 30 * leftWeeks; // 0.3% * left weeks

        return (amount * bps) / aprCalculatorContract.getDENOMINATOR();
    }

    /**
     * @notice Function that applies the custom factors - base APR, vest bonus and rsi bonus
     * @dev Denominator is used because we should work with floating-point numbers
     * @param reward index The reward to which we gonna apply the custom APR
     * @dev The reward with the applied APR
     */
    function _applyCustomAPR(
        VestingPosition memory position,
        uint256 reward,
        bool rsi
    ) internal view returns (uint256) {
        uint256 bonus = (position.base + position.vestBonus);
        uint256 divider = aprCalculatorContract.getDENOMINATOR();
        if (rsi && position.rsiBonus != 0) {
            bonus = bonus * position.rsiBonus;
            divider *= divider;
        }

        return (reward * bonus) / divider / aprCalculatorContract.getEpochsPerYear();
    }

    function _saveStakerRewardData(address staker, uint256 epoch) internal {
        StakingRewardsHistory memory rewardData = StakingRewardsHistory({
            totalReward: stakingRewards[staker].total,
            epoch: epoch,
            timestamp: block.timestamp
        });

        stakingRewardsHistory[staker].push(rewardData);
    }
}
