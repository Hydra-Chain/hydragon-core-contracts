// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Price} from "../Price/Price.sol";
import {IRSIndex} from "./IRSIndex.sol";

import "hardhat/console.sol";

abstract contract RSIndex is IRSIndex, Price {
    uint256 public constant MAX_RSI_BONUS = 17000;
    uint256 public constant DENOMINATOR1 = 10000;

    bool public disabledRSI;
    uint256 public averageGain;
    uint256 public averageLoss;
    uint256 public rsi;
    uint256[] public updatedPricesRSI;

    // _______________ Initializer _______________

    function __RSIndex_init() internal onlyInitializing {
        __RSIndex_init_unchained();
    }

    function __RSIndex_init_unchained() internal onlyInitializing {}

    // _______________ External functions _______________

    /**
     * @inheritdoc IRSIndex
     */
    function gardRSIndex() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!disabledRSI) {
            disabledRSI = true;
            rsi = 0;

            emit RSIBonusSet(0);
        } else {
            disabledRSI = false;
        }
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
     * @param _price The price to be used for the update.
     */
    function _onPriceUpdate(uint256 _price) internal virtual override(Price) {
        console.log("Enter RSI: %s", _price);
        if (!disabledRSI) {
            updatedPricesRSI.push(_price);
            _triggerRSIUpdate();
        }
    }

    // _______________ Private functions _______________

    /**
     * @notice Calculate the average gain and loss based on the updated prices
     */
    function _triggerRSIUpdate() private {
        uint256 gain;
        uint256 loss;
        uint256 arrLenght = updatedPricesRSI.length;
        if (arrLenght > 15) {
            uint256 lastPrice = updatedPricesRSI[arrLenght - 1];
            uint256 secondLastPrice = updatedPricesRSI[arrLenght - 2];
            if (lastPrice > secondLastPrice) {
                averageGain = ((averageGain * 13) + ((lastPrice - secondLastPrice) * DENOMINATOR)) / 14;
                averageLoss = (averageLoss * 13) / 14;
                console.log("averageGain", averageGain);
            } else if (lastPrice < secondLastPrice) {
                averageLoss = ((averageLoss * 13) + ((secondLastPrice - lastPrice) * DENOMINATOR)) / 14;
                averageGain = (averageGain * 13) / 14;
            } else {
                return;
            }
        } else if (arrLenght == 15) {
            for (uint256 i = 1; i < arrLenght; i++) {
                if (updatedPricesRSI[i] > updatedPricesRSI[i - 1]) {
                    gain += updatedPricesRSI[i] - updatedPricesRSI[i - 1];
                } else if (updatedPricesRSI[i] < updatedPricesRSI[i - 1]) {
                    loss += updatedPricesRSI[i - 1] - updatedPricesRSI[i];
                }
            }

            averageGain = (gain * DENOMINATOR) / 14;
            averageLoss = (loss * DENOMINATOR) / 14;
        } else {
            return;
        }
        console.log("averageGain", averageGain);
        console.log("averageLoss", averageLoss);

        _calcRSIndex();
    }

    /**
     * @notice Calculate the Relative Strength, based on average gain and loss
     */
    function _calcRSIndex() private {
        uint256 rsindex;
        uint256 avrGain = averageGain;
        uint256 avrLoss = averageLoss;

        if (avrGain == 0) {
            rsindex = 0;
            console.log("Enter gain = 0: %s", rsindex);
        } else if (avrLoss == 0) {
            rsindex = 100 * DENOMINATOR1 - ((100 * DENOMINATOR1) / (1 + avrGain));
            console.log("Enter loss = 0: %s", rsindex);
        } else {
            uint256 rs = (avrGain * DENOMINATOR1) / avrLoss;
            rsindex = 100 * DENOMINATOR1 - (100 * (DENOMINATOR1 * 2)) / (DENOMINATOR1 + rs);
        }

        _setRSI(rsindex / DENOMINATOR1);
    }

    /**
     * @notice Set the Relative Strength Index (RSI) bonus based on the SMA ratio
     * @param rsindex The relative strength
     */
    function _setRSI(uint256 rsindex) private {
        console.log("rsindex: %s", rsindex);

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

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
