// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "./../common/Errors.sol";
import {IAPRCalculator} from "./IAPRCalculator.sol";

abstract contract APRCalculatorConnector is Initializable {
    IAPRCalculator public aprCalculatorContract;

    // _______________ Initializer _______________

    function __APRCalculatorConnector_init(address _aprCalculatorAddr) internal onlyInitializing {
        __APRCalculatorConnector_init_unchained(_aprCalculatorAddr);
    }

    function __APRCalculatorConnector_init_unchained(address _aprCalculatorAddr) internal onlyInitializing {
        aprCalculatorContract = IAPRCalculator(_aprCalculatorAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyAPRCalculator() {
        if (msg.sender != address(aprCalculatorContract)) {
            revert Unauthorized("ONLY_APR_CALCULATOR");
        }

        _;
    }
}
