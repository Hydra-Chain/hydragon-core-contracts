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

    function __RSIndex_init_unchained() internal onlyInitializing {
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IRSIndex
     */
    function gardRSIndex() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!disabledRSI) {
            disabledRSI = true;
            rsi = 0;
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
     * @notice Calculate the Simple Moving Average (SMA) ratio and set the macro factor accordingly.
     */
    function _calcRSI() internal {
        uint256 avrGain = averageGain;
        uint256 avrLoss = averageLoss;
        if (avrGain == 0) {
            avrGain = 1;
        }

        if (avrLoss == 0) {
            avrLoss = 1;
        }

        console.log("avrGain", avrGain);

        uint256 rs = (avrGain * DENOMINATOR1) / avrLoss;
        console.log("rs", rs);
        _setRSI(rs);
    }

    // _______________ Private functions _______________

    /**
     * @notice Set the macro factor based on the Simple Moving Average (SMA) ratio.
     * @param rs The Simple Moving Average (SMA) ratio
     */
    function _setRSI(uint256 rs) private {
        uint256 rsindex = 100 - ((100 * DENOMINATOR1) / (1 + rs));
        uint256 newRsi = rsindex;
        console.log("rsindex", rsindex);
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
        console.log("rsi", rsi);
        emit RSIndexSet(newRsi);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
