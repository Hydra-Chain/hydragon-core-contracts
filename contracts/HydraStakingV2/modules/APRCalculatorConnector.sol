// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IAPRCalculator} from "./../../APRCalculator/IAPRCalculator.sol";

import {Unauthorized} from "./../../common/Errors.sol";

abstract contract APRCalculatorConnector is Initializable {
    IAPRCalculator public aprCalculatorContract;

    function __APRCalculatorConnector_init(address aprCalculatorAddr) internal onlyInitializing {
        __APRCalculatorConnector_init_unchained(aprCalculatorAddr);
    }

    function __APRCalculatorConnector_init_unchained(address aprCalculatorAddr) internal onlyInitializing {
        aprCalculatorContract = IAPRCalculator(aprCalculatorAddr);
    }

    modifier onlyAPRCalculator() {
        if (msg.sender != address(aprCalculatorContract)) {
            revert Unauthorized("ONLY_APR_CALCULATOR");
        }

        _;
    }
}
