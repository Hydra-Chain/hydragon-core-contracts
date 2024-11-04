// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct ValidatorPower {
    address validator;
    uint256 votingPower;
}

interface IValidatorsData {
    /**
     * @notice Syncs the validators voting power with the provided data
     * @param validatorsPower Array of ValidatorPower struct
     * @dev This function can be called only by the system
     */
    function syncValidatorsData(ValidatorPower[] calldata validatorsPower) external;

    /**
     * @notice Returns the voting power of the validator
     * @param validator Address of the validator
     * @return uint256 Voting power of the validator
     */
    function getValidatorPower(address validator) external view returns (uint256);

    /**
     * @notice Returns the total voting power of the validators
     * @return uint256 Total voting power of the validators
     */
    function getTotalVotingPower() external view returns (uint256);
}
