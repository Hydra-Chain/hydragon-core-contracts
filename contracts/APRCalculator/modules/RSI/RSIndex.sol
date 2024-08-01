// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {Governed} from "../../../common/Governed/Governed.sol";
import {IRSIndex} from "./IRSIndex.sol";

import "hardhat/console.sol";

abstract contract RSIndex is IRSIndex, Initializable, Governed {
    uint256 public constant MAX_RSI_BONUS = 17000;
    uint256 public constant DENOMINATOR1 = 10000;

    bool public disabledRSI;
    uint256 public averageGain;
    uint256 public averageLoss;
    uint256 public rsi;

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
     * @notice Calculate the Relative Strength, based on average gain and loss
     */
    function _calcRSIndex() internal {
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

    // _______________ Private functions _______________

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
