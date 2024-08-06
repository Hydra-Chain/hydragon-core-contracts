// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {IPriceOracle} from "./IPriceOracle.sol";

/**
 * @title PriceOracle
 * @dev This contract will be responsible for the price updates.
 * Active validators will be able to vote and agree on the price.
 */
contract PriceOracle is IPriceOracle, System, Initializable {
    // _______________ Initializer _______________

    function initialize() external initializer onlySystemCall {}

    function _initialize() internal onlyInitializing {}

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
