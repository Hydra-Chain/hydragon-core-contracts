// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {IPriceOracle} from "./IPriceOracle.sol";

abstract contract PriceOracleConnector is Initializable {
    IPriceOracle public priceOracleContract;

    // _______________ Initializer _______________

    function __PriceOracleConnector_init(address _priceOracleAddr) internal onlyInitializing {
        __PriceOracleConnector_init_unchained(_priceOracleAddr);
    }

    function __PriceOracleConnector_init_unchained(address _priceOracleAddr) internal onlyInitializing {
        priceOracleContract = IPriceOracle(_priceOracleAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyPriceOracle() {
        if (msg.sender != address(priceOracleContract)) {
            revert Unauthorized("ONLY_PRICE_ORACLE");
        }

        _;
    }
}
