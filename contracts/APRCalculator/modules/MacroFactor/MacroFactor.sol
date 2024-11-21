// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Price} from "../Price/Price.sol";
import {IMacroFactor} from "./IMacroFactor.sol";

abstract contract MacroFactor is IMacroFactor, Price {
    uint256 public constant FAST_SMA = 115;
    uint256 public constant SLOW_SMA = 310;
    uint256 public constant MIN_MACRO_FACTOR = 1250;
    uint256 public constant MAX_MACRO_FACTOR = 17500;

    uint256 public smaFastSum;
    uint256 public smaSlowSum;
    uint256 public macroFactor;
    uint256 public defaultMacroFactor;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __MacroFactor_init() internal onlyInitializing {
        __MacroFactor_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __MacroFactor_init_unchained() internal onlyInitializing {
        defaultMacroFactor = 7500;
        _initializeMacroFactor();
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IMacroFactor
     */
    function changeDefaultMacroFactor(uint256 _macroFactor) external onlyGovernance {
        if (_macroFactor < MIN_MACRO_FACTOR || _macroFactor > MAX_MACRO_FACTOR) {
            revert InvalidMacroFactor();
        }

        defaultMacroFactor = _macroFactor;

        emit DefaultMacroFactorChanged(_macroFactor);
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
    function _onPriceUpdate(uint256 _price) internal virtual override {
        _triggerMacroUpdate(_price);
    }

    /**
     * @inheritdoc Price
     * @notice Reset the macro factor to the default value.
     */
    function _resetBonuses() internal virtual override {
        macroFactor = defaultMacroFactor;
        emit MacroFactorSet(defaultMacroFactor);
    }

    // _______________ Private functions _______________

    /**
     * @notice Trigger the macro factor update.
     * @param _price The price to be used for the update.
     */
    function _triggerMacroUpdate(uint256 _price) private {
        smaFastSum += _price;
        smaSlowSum += _price;

        uint256 arrLength = updatedPrices.length;

        smaFastSum -= updatedPrices[arrLength - FAST_SMA];
        smaSlowSum -= updatedPrices[arrLength - SLOW_SMA];

        uint256 smaRatio = _calcSMA();
        _setMacroFactor(smaRatio);
    }

    /**
     * @notice Calculate the Simple Moving Average (SMA) ratio and set the macro factor accordingly.
     */
    function _calcSMA() private view returns (uint256 smaRatio) {
        uint256 smaFast = (smaFastSum * DENOMINATOR) / FAST_SMA;
        uint256 smaSlow = smaSlowSum / SLOW_SMA;
        smaRatio = smaFast / smaSlow;
    }

    /**
     * @notice Set the macro factor based on the Simple Moving Average (SMA) ratio.
     * @param smaRatio The Simple Moving Average (SMA) ratio
     */
    function _setMacroFactor(uint256 smaRatio) private {
        uint256 newMacroFactor;
        if (smaRatio < 5000) {
            newMacroFactor = MIN_MACRO_FACTOR;
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
            newMacroFactor = MAX_MACRO_FACTOR;
        }
        macroFactor = newMacroFactor;

        emit MacroFactorSet(newMacroFactor);
    }

    /**
     * @notice Initialize the macro factor based on the historical prices.
     */
    function _initializeMacroFactor() private {
        uint256 arrLength = updatedPrices.length;
        assert(arrLength == SLOW_SMA);
        uint256 smaThreshold = SLOW_SMA - FAST_SMA;
        for (uint256 i = 0; i < arrLength; i++) {
            smaSlowSum += updatedPrices[i];

            if (i >= smaThreshold) {
                smaFastSum += updatedPrices[i];
            }
        }
        uint256 smaRatio = _calcSMA();
        _setMacroFactor(smaRatio);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
