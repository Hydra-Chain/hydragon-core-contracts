// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct ValidatorPower {
    address validator;
    uint256 votingPower;
}

interface IValidatorsData {
    /**
     * @notice Syncs the validators davolding power with the provided data
     * @param validatorsPower Array of ValidatorPower struct
     * @dev This function can be called only by the system
     */
    function syncValidatorsData(ValidatorPower[] calldata validatorsPower) external;
}
