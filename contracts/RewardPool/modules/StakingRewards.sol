// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Vesting.sol";
import "./RewardsWithdrawal.sol";
import "./../RewardPoolBase.sol";
import "./../libs/DelegationPoolLib.sol";
import "./../libs/VestingPositionLib.sol";
import "./../../common/Errors.sol";
import "./../../common/Errors.sol";

struct ValReward {
    uint256 taken;
    uint256 total;
}

abstract contract StakingRewards is RewardPoolBase, Vesting, RewardsWithdrawal {
    using VestingPositionLib for VestingPosition;
    using DelegationPoolLib for DelegationPool;

    /// @notice The validator rewards mapped to a validator's address
    mapping(address => ValReward) public valRewards;

    // _______________ External functions _______________

    /**
     * @inheritdoc IRewardPool
     */
    function onStake(address staker, uint256 amount, uint256 oldBalance) external onlyValidatorSet {
        if (positions[staker].isActive()) {
            _handleStake(staker, amount, oldBalance);
        }
    }

    function claimValidatorReward() external {
        if (positions[msg.sender].isStakerInVestingCycle()) {
            return;
        }

        uint256 reward = _calcValidatorReward(msg.sender);
        if (reward == 0) {
            return;
        }

        _claimValidatorReward(msg.sender, reward);
        _withdrawRewards(msg.sender, reward);

        emit ValidatorRewardClaimed(msg.sender, reward);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onUnstake(
        address staker,
        uint256 amountUnstaked,
        uint256 amountLeft
    ) external onlyValidatorSet returns (uint256 amountToWithdraw) {
        VestingPosition memory position = positions[staker];
        if (position.isActive()) {
            // staker lose its reward
            valRewards[staker].taken = valRewards[staker].total;
            uint256 penalty = _calcSlashing(position, amountUnstaked);
            // if position is closed when active, we delete all the vesting data
            if (amountLeft == 0) {
                delete positions[staker];
            }

            return amountUnstaked - penalty;
        }

        return amountUnstaked;
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onNewStakePosition(address staker, uint256 durationWeeks) external onlyValidatorSet {
        if (positions[staker].isStakerInVestingCycle()) {
            revert StakeRequirement({src: "vesting", msg: "ALREADY_IN_VESTING"});
        }

        uint256 duration = durationWeeks * 1 weeks;
        positions[staker] = VestingPosition({
            duration: duration,
            start: block.timestamp,
            end: block.timestamp + duration,
            base: base,
            vestBonus: getVestingBonus(durationWeeks),
            rsiBonus: uint248(rsi)
        });

        delete valRewards[staker];
    }

    /**
     * @inheritdoc IRewardPool
     */
    function calculateStakePositionPenalty(
        address staker,
        uint256 amount
    ) external view returns (uint256 penalty, uint256 reward) {
        VestingPosition memory position = positions[staker];
        if (position.isActive()) {
            penalty = _calcSlashing(position, amount);
            // staker left reward
            reward = valRewards[staker].total - valRewards[staker].taken;
        }
    }

    function getValidatorReward(address validator) external view returns (uint256) {
        return valRewards[validator].total - valRewards[validator].taken;
    }

    // _______________ Public functions _______________

    function claimValidatorReward(uint256 rewardHistoryIndex) public {
        if (!positions[msg.sender].isMaturing()) {
            revert StakeRequirement({src: "vesting", msg: "NOT_MATURING"});
        }

        uint256 reward = _calcValidatorReward(msg.sender, rewardHistoryIndex);
        if (reward == 0) return;

        _claimValidatorReward(msg.sender, reward);
        _withdrawRewards(msg.sender, reward);

        emit ValidatorRewardClaimed(msg.sender, reward);
    }

    // _______________ Internal functions _______________

    function _saveValRewardData(address validator, uint256 epoch) internal {
        ValRewardHistory memory rewardData = ValRewardHistory({
            totalReward: valRewards[validator].total,
            epoch: epoch,
            timestamp: block.timestamp
        });

        valRewardHistory[validator].push(rewardData);
    }

    function _claimValidatorReward(address validator, uint256 reward) internal {
        valRewards[validator].taken += reward;
    }

    function _calcValidatorReward(address validator) internal view returns (uint256) {
        return valRewards[validator].total - valRewards[validator].taken;
    }

    /**
     * @dev Ensure the function is executed for maturing positions only
     */
    function _calcValidatorReward(address validator, uint256 rewardHistoryIndex) internal view returns (uint256) {
        VestingPosition memory position = positions[msg.sender];
        uint256 maturedPeriod = block.timestamp - position.end;
        uint256 alreadyMatured = position.start + maturedPeriod;
        ValRewardHistory memory rewardData = valRewardHistory[msg.sender][rewardHistoryIndex];
        // If the given data is for still not matured period - it is wrong, so revert
        if (rewardData.timestamp > alreadyMatured) {
            revert StakeRequirement({src: "stakerVesting", msg: "WRONG_DATA"});
        }

        if (rewardData.totalReward > valRewards[validator].taken) {
            return rewardData.totalReward - valRewards[validator].taken;
        }

        return 0;
    }
}
