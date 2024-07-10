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
    event PositionSwapped(
        address indexed manager,
        address indexed oldValidator,
        address indexed newValidator,
        uint256 amount
    );
    event PositionRewardClaimed(address indexed manager, address indexed validator, uint256 amount);

    /**
     * @notice Gets delegators's matured unclaimed rewards for a position
     * @param validator Address of validator
     * @param delegator Address of delegator
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to redelegate the claimed rewards
     * @return Delegator's unclaimed rewards with validator (in HYDRA wei)
     */
    function getDelegatorPositionReward(
        address validator,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external view returns (uint256);

    /**
     * @notice Gets the RPS values for a validator in a given epoch range.
     * @param validator Validator that is deleagted to
     * @param startEpoch Start epoch for values
     * @param endEpoch End epoch for values
     */
    function getRPSValues(address validator, uint256 startEpoch, uint256 endEpoch) external view returns (RPS[] memory);

    /**
     * @notice Gets the delegation pool params history for a validator and delegator.
     * @param validator Validator that is delegated to
     * @param delegator Delegator that delegated
     */
    function getDelegationPoolParamsHistory(
        address validator,
        address delegator
    ) external view returns (DelegationPoolParams[] memory);

    /**
     * @notice Calculates the penalty for the position.
     * @param validator Validator to calculate penalty for
     * @param delegator Delegator to calculate penalty for
     * @param amount Amount to calculate penalty for
     */
    function calculatePositionPenalty(
        address validator,
        address delegator,
        uint256 amount
    ) external view returns (uint256 penalty);

    /**
     * @notice Returns true if the position is active.
     * @param validator Validator for the position
     * @param delegator Delegator for the position
     */
    function isActiveDelegatePosition(address validator, address delegator) external view returns (bool);

    /**
     * @notice Returns true if the position is maturing.
     * @param validator Validator for the position
     * @param delegator Delegator for the position
     */
    function isMaturingDelegatePosition(address validator, address delegator) external view returns (bool);

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
