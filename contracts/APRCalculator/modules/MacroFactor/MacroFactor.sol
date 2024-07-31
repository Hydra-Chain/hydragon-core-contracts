// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {Governed} from "../../../common/Governed/Governed.sol";
import {IMacroFactor} from "./IMacroFactor.sol";

abstract contract MacroFactor is IMacroFactor, Initializable, System, Governed {
    uint256 public constant FAST_SMA = 115;
    uint256 public constant SLOW_SMA = 310;
    uint256 public constant DENOMINATOR = 10000;
    uint256 public constant INITIAL_MACRO_FACTOR = 7500;
    bytes32 public constant MANAGER_ROLE = keccak256("manager_role");

    bool public disabledMacro;
    uint256 public smaFastSum;
    uint256 public smaSlowSum;
    uint256 public macroFactor;
    uint256[] public updatedPrices;

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
    function gardMacroFactor() external onlyRole(MANAGER_ROLE) {
        if (!disabledMacro) {
            disabledMacro = true;
            macroFactor = INITIAL_MACRO_FACTOR;

            emit MacroFactorSet(INITIAL_MACRO_FACTOR);
        } else {
            disabledMacro = false;
        }
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IMacroFactor
     */
    function getMacroFactor() public view returns (uint256) {
        return macroFactor;
    }

    // _______________ Internal functions _______________

    /**
     * @notice Calculate the Simple Moving Average (SMA) ratio and set the macro factor accordingly.
     */
    function _calcSMA() internal {
        uint256 smaFast = smaFastSum / FAST_SMA;
        uint256 smaSlow = smaSlowSum / SLOW_SMA;
        uint256 smaRatio = (smaFast * DENOMINATOR) / smaSlow;
        _setMacroFactor(smaRatio);
    }

    // _______________ Private functions _______________

    /**
     * @notice Set the macro factor based on the Simple Moving Average (SMA) ratio.
     * @param smaRatio The Simple Moving Average (SMA) ratio
     */
    function _setMacroFactor(uint256 smaRatio) private {
        uint256 newMacroFactor;
        if (smaRatio < 5000) {
            newMacroFactor = 1250;
        } else if (smaRatio < 7500) {
            newMacroFactor = 2500;
        } else if (smaRatio < 9000) {
            newMacroFactor = 5000;
        } else if (smaRatio < 11000) {
            newMacroFactor = 7500;
        } else if (smaRatio < 12500) {
            newMacroFactor = 10000;
        } else if (smaRatio < 17500) {
            newMacroFactor = 12500;
        } else {
            newMacroFactor = 17500;
        }
        macroFactor = newMacroFactor;

        emit MacroFactorSet(newMacroFactor);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
