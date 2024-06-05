// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IDelegation {
    event Delegated(address indexed validator, address indexed delegator, uint256 amount);
    event Undelegated(address indexed validator, address indexed delegator, uint256 amount);

    /**
     * @notice Delegates sent amount to validator and claims rewards.
     * @param validator Validator to delegate to
     */
    function delegate(address validator) external payable;

    /**
     * @notice Undelegates amount from validator for sender and claims rewards.
     * @param validator Validator to undelegate from
     * @param amount The amount to undelegate
     */
    function undelegate(address validator, uint256 amount) external;

    /**
     * @notice Delegates sent amount to validator. Set vesting position data.
     * Delete old pool params data, if exists. Can be called by vesting positions' managers only.
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
}
