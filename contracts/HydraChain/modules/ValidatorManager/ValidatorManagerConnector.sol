// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../../../common/Errors.sol";
import {IValidatorManager} from "./IValidatorManager.sol";

abstract contract ValidatorManagerConnector is Initializable {
    IValidatorManager public validatorManagerContract;

    // _______________ Initializer _______________

    function __ValidatorManagerConnector_init(address validatorManagerAddr) internal onlyInitializing {
        __ValidatorManagerConnector_init_unchained(validatorManagerAddr);
    }

    function __ValidatorManagerConnector_init_unchained(address validatorManagerAddr) internal onlyInitializing {
        validatorManagerContract = IValidatorManager(validatorManagerAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyValidatorManager() {
        if (msg.sender != address(validatorManagerContract)) {
            revert Unauthorized("ONLY_VALIDATOR_MANAGER");
        }

        _;
    }
}
