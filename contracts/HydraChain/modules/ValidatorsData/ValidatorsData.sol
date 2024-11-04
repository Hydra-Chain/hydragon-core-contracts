// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {IValidatorsData, ValidatorPower} from "./IValidatorsData.sol";

/**
 * @title ValidatorsData
 * @dev This module will be responsible for giving access to the validators voting power in real-time (for each epoch).
 * We need it because the ValidatorsManager shows updates that are not applied on core consensus level yet.
 */
abstract contract ValidatorsData is IValidatorsData, System, Initializable {
    mapping(address => uint256) public validatorPower;
    uint256 public totalVotingPower;

    // _______________ External functions _______________

    /**
     * @inheritdoc IValidatorsData
     */
    function syncValidatorsData(ValidatorPower[] calldata validatorsPower) external onlySystemCall {
        uint256 arrLength = validatorsPower.length;
        uint256 totalNewPower = 0;
        uint256 totalOldPower = 0;
        for (uint256 i = 0; i < arrLength; i++) {
            totalNewPower += validatorsPower[i].votingPower;
            totalOldPower += validatorPower[validatorsPower[i].validator];
            validatorPower[validatorsPower[i].validator] = validatorsPower[i].votingPower;
        }

        if (totalNewPower > totalOldPower) {
            totalVotingPower += totalNewPower - totalOldPower;
        } else {
            totalVotingPower -= totalOldPower - totalNewPower;
        }
    }

    /**
     * @inheritdoc IValidatorsData
     */
    function getValidatorPower(address validator) external view returns (uint256) {
        return validatorPower[validator];
    }

    /**
     * @inheritdoc IValidatorsData
     */
    function getTotalVotingPower() external view returns (uint256) {
        return totalVotingPower;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
