// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @notice Data type for the banned validators' withdrawals
 * @param liquidTokens The amount of liquid tokens to be taken on withdrawal from the penalized validator
 * @param withdrawableAmount The amount that is available for withdrawal after validator's penalty
 */
struct WithdrawalInfo {
    uint256 liquidTokens;
    uint256 withdrawableAmount;
}

interface IInspector {
    event ValidatorBanned(address indexed validator);

    /**
     * @notice Manual ban of a validator
     * @dev Function can be executed only by the governor/owner
     * @param validator Address of the validator
     */
    function banValidator(address validator) external;

    /**
     * @notice Set the penalty amount for the banned validators
     * @param newPenalty Amount of the penalty
     */
    function setValidatorPenalty(uint256 newPenalty) external;

    /**
     * @notice Set the reward of the person who reports a validator
     * @param newReward Amount of the reward
     */
    function setReporterReward(uint256 newReward) external;

    /**
     * @notice Withdraw funds left for a banned validator
     * @dev Function can be executed only by the banned validator
     */
    function withdrawBannedFunds() external;
}
