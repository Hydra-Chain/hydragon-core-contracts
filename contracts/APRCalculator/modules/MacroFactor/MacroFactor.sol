// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {Price} from "../Price/Price.sol";
import {IMacroFactor} from "./IMacroFactor.sol";

abstract contract MacroFactor is IMacroFactor, Initializable, System, Price {
    uint256 public constant DENOMINATOR = 10000;
    uint256 public constant INITIAL_MACRO_FACTOR = 7500;

    uint256 public macroFactor;

    // _______________ Initializer _______________

    function __MacroFactor_init() internal onlyInitializing {
        __MacroFactor_init_unchained();
    }

    function __MacroFactor_init_unchained() internal onlyInitializing {
        macroFactor = INITIAL_MACRO_FACTOR;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IMacroFactor
     */
    function setMacroFactor() external onlySystemCall {
        uint256 smaRatio = (smaFastSum * DENOMINATOR) / (smaSloweSum * DENOMINATOR);
        _setMacroFactor(smaRatio);

        emit MacroFactorSet(macroFactor);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IMacroFactor
     */
    function getMacroFactor() public view returns (uint256) {
        return macroFactor;
    }

    // _______________ Private functions _______________

    function _setMacroFactor(uint256 smaRatio) private {
        if (smaRatio < 5000) {
            macroFactor = 1250;
        } else if (smaRatio < 7500) {
            macroFactor = 2500;
        } else if (smaRatio < 9000) {
            macroFactor = 5000;
        } else if (smaRatio < 11000) {
            macroFactor = 7500;
        } else if (smaRatio < 12500) {
            macroFactor = 10000;
        } else if (smaRatio < 17500) {
            macroFactor = 12500;
        } else {
            macroFactor = 17500;
        }
    }
}
