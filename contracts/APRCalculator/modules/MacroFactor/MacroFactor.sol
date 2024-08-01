// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Price} from "../Price/Price.sol";
import {IMacroFactor} from "./IMacroFactor.sol";

abstract contract MacroFactor is IMacroFactor, Price {
    uint256 public constant FAST_SMA = 115;
    uint256 public constant SLOW_SMA = 310;
    uint256 public constant INITIAL_MACRO_FACTOR = 7500;

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
     * @inheritdoc Price
     * @notice Update the macro factor based on the price update, if the needed conditions are met.
     * @param _price The price to be used for the update.
     */
    function _onPriceUpdate(uint256 _price) internal override(Price) {
        if (!disabledMacro) {
            _triggerMacroUpdate(_price);
        }
    }

    // _______________ Private functions _______________

    /**
     * @notice Trigger the macro factor update.
     * @param _price The price to be used for the update.
     */
    function _triggerMacroUpdate(uint256 _price) private {
        updatedPrices.push(_price);
        smaFastSum += _price;
        smaSlowSum += _price;

        uint256 arrLenght = updatedPrices.length;
        if (arrLenght >= SLOW_SMA) {
            smaFastSum -= updatedPrices[arrLenght - FAST_SMA];
            smaSlowSum -= updatedPrices[arrLenght - SLOW_SMA];

            _calcSMA();
        } else if (arrLenght > FAST_SMA) {
            smaFastSum -= updatedPrices[arrLenght - FAST_SMA];
        }
    }

    /**
     * @notice Calculate the Simple Moving Average (SMA) ratio and set the macro factor accordingly.
     */
    function _calcSMA() private {
        uint256 smaFast = smaFastSum / FAST_SMA;
        uint256 smaSlow = smaSlowSum / SLOW_SMA;
        uint256 smaRatio = (smaFast * DENOMINATOR) / smaSlow;
        _setMacroFactor(smaRatio);
    }

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
