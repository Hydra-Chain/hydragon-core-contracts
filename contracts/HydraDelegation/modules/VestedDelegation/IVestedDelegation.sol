// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IDelegation} from "./../../IDelegation.sol";

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
        address indexed validator,
        uint256 indexed weeksDuration,
        uint256 amount
    );
    event PositionCut(address indexed manager, address indexed validator, uint256 amount);
    event PositionSwapped(address indexed manager, address indexed oldValidator, address newValidator, uint256 amount);
    event PositionRewardClaimed(address indexed manager, address indexed validator, uint256 amount);

    /// @notice Gets the vesting managers per user address for fast off-chain lookup.
    function getUserVestingManagers(address user) external view returns (address[] memory);

    /**
     * @notice Creates new vesting manager which owner is the caller.
     * Every new instance is proxy leading to base impl, so minimal fees are applied.
     * Only Vesting manager can use the vesting functionality,
     * so users need to create a manager first to be able to vest.
     */
    function newManager(address rewardPool) external;

    /**
     * @notice Delegates sent amount to validator. Set vesting position data.
     * Delete old pool params data, if exists.
     * Can be used by vesting positions' managers only.
     * @param validator Validator to delegate to
     * @param durationWeeks Duration of the vesting in weeks
     */
    function delegateWithVesting(address validator, uint256 durationWeeks) external payable;

    /**
     * @notice Undelegates amount from validator for vesting position. Apply penalty in case vesting is not finished.
     * Can be called by vesting positions' managers only.
     * @param validator Validator to undelegate from
     * @param amount Amount to be undelegated
     */
    function undelegateWithVesting(address validator, uint256 amount) external;

    /**
     * @notice Move a vested position to another validator.
     * Can be called by vesting positions' managers only.
     * @param oldValidator Validator to swap from
     * @param newValidator Validator to swap to
     */
    function swapVestedPositionValidator(address oldValidator, address newValidator) external;

    /**
     * @notice Claims reward for the vest manager (delegator).
     * @param validator Validator to claim from
     * @param to Address to transfer the reward to
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to redelegate the claimed rewards
     */
    function claimPositionReward(
        address validator,
        address to,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external;
}
