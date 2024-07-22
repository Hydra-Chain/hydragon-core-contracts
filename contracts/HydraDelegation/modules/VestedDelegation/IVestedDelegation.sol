// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IDelegation} from "../../IDelegation.sol";

struct DelegationPoolParams {
    uint256 balance;
    int256 correction;
    uint256 epochNum;
}

// Reward Per Share
struct RPS {
    uint192 value;
    uint64 timestamp;
}

interface IVestedDelegation is IDelegation {
    event PositionOpened(
        address indexed manager,
        address indexed staker,
        uint256 indexed weeksDuration,
        uint256 amount
    );
    event PositionCut(address indexed manager, address indexed staker, uint256 amount);
    event PositionSwapped(
        address indexed manager,
        address indexed oldStaker,
        address indexed newStaker,
        uint256 amount
    );
    event PositionRewardClaimed(address indexed manager, address indexed staker, uint256 amount);

    error NotVestingManager();

    /**
     * @notice Gets delegators's matured unclaimed rewards for a position
     * @param staker Address of validator
     * @param delegator Address of delegator
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to redelegate the claimed rewards
     * @return Delegator's unclaimed rewards with staker (in HYDRA wei)
     */
    function getDelegatorPositionReward(
        address staker,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external view returns (uint256);

    /**
     * @notice Gets the RPS values for a staker in a given epoch range.
     * @param staker Validator that is deleagted to
     * @param startEpoch Start epoch for values
     * @param endEpoch End epoch for values
     */
    function getRPSValues(address staker, uint256 startEpoch, uint256 endEpoch) external view returns (RPS[] memory);

    /**
     * @notice Gets the delegation pool params history for a staker and delegator.
     * @param staker Validator that is delegated to
     * @param delegator Delegator that delegated
     */
    function getDelegationPoolParamsHistory(
        address staker,
        address delegator
    ) external view returns (DelegationPoolParams[] memory);

    /**
     * @notice Calculates the penalty for the position.
     * @param staker Validator to calculate penalty for
     * @param delegator Delegator to calculate penalty for
     * @param amount Amount to calculate penalty for
     */
    function calculatePositionPenalty(
        address staker,
        address delegator,
        uint256 amount
    ) external view returns (uint256 penalty);

    /**
     * @notice Returns true if the position is active.
     * @param staker Validator for the position
     * @param delegator Delegator for the position
     */
    function isActiveDelegatePosition(address staker, address delegator) external view returns (bool);

    /**
     * @notice Returns true if the position is maturing.
     * @param staker Validator for the position
     * @param delegator Delegator for the position
     */
    function isMaturingDelegatePosition(address staker, address delegator) external view returns (bool);

    /**
     * @notice Delegates sent amount to staker. Set vesting position data.
     * Delete old pool params data, if exists.
     * Can be used by vesting positions' managers only.
     * @param staker Validator to delegate to
     * @param durationWeeks Duration of the vesting in weeks
     */
    function delegateWithVesting(address staker, uint256 durationWeeks) external payable;

    /**
     * @notice Undelegates amount from staker for vesting position. Apply penalty in case vesting is not finished.
     * Can be called by vesting positions' managers only.
     * @param staker Validator to undelegate from
     * @param amount Amount to be undelegated
     */
    function undelegateWithVesting(address staker, uint256 amount) external;

    /**
     * @notice Move a vested position to another staker.
     * Can be called by vesting positions' managers only.
     * @param oldStaker Validator to swap from
     * @param newStaker Validator to swap to
     */
    function swapVestedPositionStaker(address oldStaker, address newStaker) external;

    /**
     * @notice Claims reward for the vest manager (delegator).
     * @param staker Validator to claim from
     * @param to Address to transfer the reward to
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to redelegate the claimed rewards
     */
    function claimPositionReward(address staker, address to, uint256 epochNumber, uint256 balanceChangeIndex) external;

    // _______________ Public functions _______________

    /**
     * @notice Checks if balance change was already made in the current epoch
     * @param staker Validator to delegate to
     * @param delegator Delegator that has delegated
     * @param currentEpochNum Current epoch number
     */
    function isBalanceChangeMade(
        address staker,
        address delegator,
        uint256 currentEpochNum
    ) external view returns (bool);

    /**
     * @notice Checks if the balance changes exceeds the threshold
     * @param staker Validator to delegate to
     * @param delegator Delegator that has delegated
     */
    function isBalanceChangeThresholdExceeded(address staker, address delegator) external view returns (bool);

    /**
     * @notice Check if the new position that the user wants to swap to is available for the swap
     * @dev Available positions one that is not active, not maturing and doesn't have any left balance or rewards
     * @param newStaker The address of the new validator
     * @param delegator The address of the delegator
     */
    function isPositionAvailableForSwap(address newStaker, address delegator) external view returns (bool);
}
