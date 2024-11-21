// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IInspector {
    event ValidatorBanned(address indexed validator);

    error NoBanSubject();
    error NoInitiateBanSubject();
    error BanAlreadyInitiated();
    error NoBanInitiated();

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
     * @notice Set the threshold that needs to be reached to initiate the ban procedure (in blocks)
     * @param newThreshold The new threshold in blocks
     */
    function setInitiateBanThreshold(uint256 newThreshold) external;

    /**
     * @notice Set the threshold that needs to be reached to finish the ban procedure (in milliseconds)
     * @param newThreshold The new threshold in blocks
     */
    function setBanThreshold(uint256 newThreshold) external;

    /**
     * @notice Method used to initiate a ban for validator, if the initiate ban threshold is reached
     * @param validator Address of the validator
     */
    function initiateBan(address validator) external;

    /**
     * @notice Method used to terminate the ban procedure
     */
    function terminateBanProcedure() external;

    /**
     * @notice Method used to ban a validator, if the ban threshold is reached
     * @dev This function will validate the threshold only if the executor is not the governance, otherwise will forcely ban the validator
     * @param validator Address of the validator
     */
    function banValidator(address validator) external;

    /**
     * @notice Returns if a ban process is initiated for a given validator
     * @param account The address of the validator
     * @return Returns true if the ban is initiated
     */
    function banIsInitiated(address account) external view returns (bool);

    // _______________ Public functions _______________

    /**
     * @notice Returns true if a ban can be finally executed for a given validator
     * @param account The address of the validator
     */
    function isSubjectToFinishBan(address account) external view returns (bool);
}
