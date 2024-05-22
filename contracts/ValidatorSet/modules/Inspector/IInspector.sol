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

    error ThresholdNotReached();

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
     * @notice Set the threshold that needs to be reached to ban a validator
     * @param newThreshold The new threshold in blocks
     */
    function setBanThreshold(uint256 newThreshold) external;

    /**
     * @notice Withdraw funds left for a banned validator
     * @dev Function can be executed only by the banned validator
     */
    function withdrawBannedFunds() external;

    /**
     * @notice Method used to ban a validator, if the ban threshold is reached
     * @dev This function will validate the threshold only if the executor is not the governor, otherwise will forcely ban the validator
     * @param validator Address of the validator
     */
    function banValidator(address validator) external;
}
