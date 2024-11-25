// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Price} from "../Price/Price.sol";
import {IRSIndex} from "./IRSIndex.sol";

abstract contract RSIndex is IRSIndex, Price {
    uint256 public constant MAX_RSI_BONUS = 17000;

    uint256 public averageGain;
    uint256 public averageLoss;
    uint256 public rsi;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __RSIndex_init(
        address hydraChainAddr,
        address priceOracleAddr,
        address governance,
        uint256[310] memory prices
    ) internal onlyInitializing {
        __Price_init(hydraChainAddr, priceOracleAddr, governance, prices);
        __RSIndex_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __RSIndex_init_unchained() internal onlyInitializing {
        _initializeRSI();
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IRSIndex
     */
    function getRSIBonus() public view returns (uint256) {
        return rsi;
    }

    // _______________ Internal functions _______________

    /**
     * @inheritdoc Price
     * @notice Update the RSI based on the price update, if the needed conditions are met.
     */
    function _onPriceUpdate(uint256 /* _price */) internal virtual override {
        _triggerRSIUpdate();
    }

    /**
     * @inheritdoc Price
     * @notice Reset the rsi to have no bonus.
     */
    function _resetBonuses() internal virtual override {
        rsi = 0;
        emit RSIBonusSet(0);
    }

    // _______________ Private functions _______________

    /**
     * @notice Calculate the average gain and loss based on the updated prices
     */
    function _triggerRSIUpdate() private {
        uint256 arrLength = updatedPrices.length;
        uint256 lastPrice = updatedPrices[arrLength - 1];
        uint256 secondLastPrice = updatedPrices[arrLength - 2];
        if (lastPrice > secondLastPrice) {
            averageGain = ((averageGain * 13) + ((lastPrice - secondLastPrice) * DENOMINATOR)) / 14;
            averageLoss = (averageLoss * 13) / 14;
        } else if (lastPrice < secondLastPrice) {
            averageLoss = ((averageLoss * 13) + ((secondLastPrice - lastPrice) * DENOMINATOR)) / 14;
            averageGain = (averageGain * 13) / 14;
        } else {
            averageGain = (averageGain * 13) / 14;
            averageLoss = (averageLoss * 13) / 14;
            return;
        }

        uint256 rsindex = _calcRSIndex();
        _setRSI(rsindex);
    }

    /**
     * @notice Calculate the Relative Strength, based on average gain and loss
     */
    function _calcRSIndex() private view returns (uint256 rsindex) {
        uint256 avrGain = averageGain;
        uint256 avrLoss = averageLoss;

        if (avrGain != 0 && avrLoss != 0) {
            uint256 rs = (avrGain * DENOMINATOR) / avrLoss;
            // index = 100 - (100 / (1 + RS))
            // we change 100 with 10000 (DENOMINATOR) to avoid floating point + multiply values * DENOMINATOR after the subtraction, because RS is already multiplied by DENOMINATOR
            rsindex = DENOMINATOR - (DENOMINATOR * DENOMINATOR) / (DENOMINATOR + rs);
        } else if (avrLoss != 0) {
            // If the average gain is 0 but average loss is not, the RS index is = 0 and we apply max bonus
            rsindex = 0;
        } else {
            // If the average loss is 0 or both are 0, the RS index is DENOMINATOR and there is no bonus
            rsindex = DENOMINATOR;
        }
    }

    /**
     * @notice Set the Relative Strength Index (RSI) bonus based on the SMA ratio
     * @param rsindex The relative strength
     */
    function _setRSI(uint256 rsindex) private {
        uint256 newRsi;
        if (rsindex > 3999) {
            newRsi = 0;
        } else if (rsindex > 2999) {
            newRsi = 11500;
        } else if (rsindex > 1999) {
            newRsi = 12500;
        } else {
            newRsi = MAX_RSI_BONUS;
        }

        rsi = newRsi;

        emit RSIBonusSet(newRsi);
    }

    /**
     * @notice Initialize the RSI based on the last 15 days of historical prices.
     */
    function _initializeRSI() private {
        uint256 arrLength = updatedPrices.length;
        assert(arrLength > 14);
        uint256 gain;
        uint256 loss;
        uint256 currentPrice;
        uint256 previousPrice;
        for (uint256 i = arrLength - 14; i < arrLength; i++) {
            currentPrice = updatedPrices[i];
            previousPrice = updatedPrices[i - 1];
            if (currentPrice > previousPrice) {
                gain += currentPrice - previousPrice;
            } else if (currentPrice < previousPrice) {
                loss += previousPrice - currentPrice;
            }
        }

        averageGain = (gain * DENOMINATOR) / 14;
        averageLoss = (loss * DENOMINATOR) / 14;

        uint256 rsindex = _calcRSIndex();
        _setRSI(rsindex);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
