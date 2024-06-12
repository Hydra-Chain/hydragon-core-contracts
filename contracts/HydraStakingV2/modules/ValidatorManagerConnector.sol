// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IValidatorManager} from "./../../HydraChain/modules/ValidatorManager/IValidatorManager.sol";

import {Unauthorized} from "./../../common/Errors.sol";

abstract contract ValidatorManagerConnector is Initializable {
    IValidatorManager public validatorManagerContract;

    function __StakingConnector_init(address validatorManagerAddr) internal onlyInitializing {
        __StakingConnector_init_unchained(validatorManagerAddr);
    }

    function __StakingConnector_init_unchained(address validatorManagerAddr) internal onlyInitializing {
        validatorManagerContract = IValidatorManager(validatorManagerAddr);
    }

    modifier onlyStaking() {
        if (msg.sender != address(validatorManagerContract)) {
            revert Unauthorized("ONLY_VALIDATOR_MANAGER");
        }

        _;
    }
}
