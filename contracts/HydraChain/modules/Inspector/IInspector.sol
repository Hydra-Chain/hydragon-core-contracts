// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IInspector {
    event ValidatorBanned(address indexed validator);

    error NoBanSubject();

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
     * @notice Method used to ban a validator, if the ban threshold is reached
     * @dev This function will validate the threshold only if the executor is not the governor, otherwise will forcely ban the validator
     * @param validator Address of the validator
     */
    function banValidator(address validator) external;
}
