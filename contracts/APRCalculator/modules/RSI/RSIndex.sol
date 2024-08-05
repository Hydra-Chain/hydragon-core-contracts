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

    function __RSIndex_init() internal onlyInitializing {
        __RSIndex_init_unchained();
    }

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
    function _onPriceUpdate(uint256 /* _price */) internal virtual override(Price) {
        _triggerRSIUpdate();
    }

    /**
     * @inheritdoc Price
     * @notice Reset the rsi to have no bonus.
     */
    function _resetBonuses() internal virtual override(Price) {
        rsi = 0;
        emit RSIBonusSet(0);
    }

    // _______________ Private functions _______________

    /**
     * @notice Calculate the average gain and loss based on the updated prices
     */
    function _triggerRSIUpdate() private {
        uint256 arrLenght = updatedPrices.length;
        uint256 lastPrice = updatedPrices[arrLenght - 1];
        uint256 secondLastPrice = updatedPrices[arrLenght - 2];
        if (lastPrice > secondLastPrice) {
            averageGain = ((averageGain * 13) + ((lastPrice - secondLastPrice) * DENOMINATOR)) / 14;
            averageLoss = (averageLoss * 13) / 14;
        } else if (lastPrice < secondLastPrice) {
            averageLoss = ((averageLoss * 13) + ((secondLastPrice - lastPrice) * DENOMINATOR)) / 14;
            averageGain = (averageGain * 13) / 14;
        } else {
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

        if (avrGain == 0) {
            rsindex = 0;
        } else if (avrLoss == 0) {
            rsindex = 100 * DENOMINATOR;
        } else {
            uint256 rs = (avrGain * DENOMINATOR) / avrLoss;
            rsindex = 100 * DENOMINATOR - (100 * DENOMINATOR) / (1 + rs);
        }

        if (rsindex > DENOMINATOR * 100 - 100) {
            rsindex -= DENOMINATOR * 100 - 100;
        } else {
            rsindex = 0;
        }
    }

    /**
     * @notice Set the Relative Strength Index (RSI) bonus based on the SMA ratio
     * @param rsindex The relative strength
     */
    function _setRSI(uint256 rsindex) private {
        uint256 newRsi;
        if (rsindex > 39) {
            newRsi = 0;
        } else if (rsindex > 29 && rsindex < 40) {
            newRsi = 11500;
        } else if (rsindex > 19 && rsindex < 30) {
            newRsi = 12500;
        } else if (rsindex < 20) {
            newRsi = MAX_RSI_BONUS;
        }

        rsi = newRsi;

        emit RSIBonusSet(newRsi);
    }

    /**
     * @notice Initialize the RSI based on the historical prices.
     */
    function _initializeRSI() private {
        uint256 arrLenght = updatedPrices.length;
        assert(arrLenght > 14);
        uint256 gain;
        uint256 loss;
        for (uint256 i = arrLenght - 14; i < arrLenght; i++) {
            if (updatedPrices[i] > updatedPrices[i - 1]) {
                gain += updatedPrices[i] - updatedPrices[i - 1];
            } else if (updatedPrices[i] < updatedPrices[i - 1]) {
                loss += updatedPrices[i - 1] - updatedPrices[i];
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
