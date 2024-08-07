// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {Unauthorized} from "../../../common/Errors.sol";
import {IValidatorsData, ValidatorPower} from "./IValidatorsData.sol";

abstract contract ValidatorsData is IValidatorsData, System, Initializable {
    mapping(address => uint256) public validatorPower;
    uint256 public totalVotingPower;

    // _______________ Initializer _______________

    function __ValidatorData_init() internal onlyInitializing {}

    function __ValidatorData_init_unchained() internal onlyInitializing {}

    // _______________ External functions _______________

    /**
     * @inheritdoc IValidatorsData
     */
    function syncValidatorsData(ValidatorPower[] calldata validatorsPower) external onlySystemCall {
        uint256 arrLength = validatorsPower.length;
        for (uint i = 0; i < arrLength; i++) {
            uint256 oldPower = validatorPower[validatorsPower[i].validator];
            validatorPower[validatorsPower[i].validator] = validatorsPower[i].votingPower;
            if (oldPower != 0) {
                totalVotingPower = totalVotingPower - oldPower + validatorsPower[i].votingPower;
            } else {
                totalVotingPower += validatorsPower[i].votingPower;
            }
        }
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
