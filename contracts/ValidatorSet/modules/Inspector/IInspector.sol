// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IInspector {
    event ValidatorBanned(address indexed validator);

    /**
     * @notice Manual ban of a validator
     * @dev can be executed only the governor/owner
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
}
