// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {Governed} from "../../../common/Governed/Governed.sol";
import {IRSIndex} from "./IRSIndex.sol";

abstract contract RSIndex is IRSIndex, Initializable, Governed {
    uint256 public constant MIN_RSI_BONUS = 10000;
    uint256 public constant MAX_RSI_BONUS = 17000;
    uint256 public constant DENOMINATOR1 = 10000;

    bool public disableRSI;
    uint256 public averageGain;
    uint256 public averageLoss;
    uint256 public rsi;

    // _______________ Initializer _______________

    function __RSIndex_init() internal onlyInitializing {
        __RSIndex_init_unchained();
    }

    function __RSIndex_init_unchained() internal onlyInitializing {
        rsi = MIN_RSI_BONUS;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IRSIndex
     */
    function gardRSIndex() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!disableRSI) {
            disableRSI = true;
            rsi = MIN_RSI_BONUS;
        } else {
            disableRSI = false;
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
        uint256 rs = (averageGain * DENOMINATOR1) / averageLoss;
        _setRSI(rs);
    }

    // _______________ Private functions _______________

    /**
     * @notice Set the macro factor based on the Simple Moving Average (SMA) ratio.
     * @param rs The Simple Moving Average (SMA) ratio
     */
    function _setRSI(uint256 rs) private {
        uint256 newRis = 100 * DENOMINATOR1 - (100 * DENOMINATOR1 / (1 + rs));
        if (newRis < MIN_RSI_BONUS) {
            rsi = MIN_RSI_BONUS;
        } else if (newRis > MAX_RSI_BONUS) {
            rsi = MAX_RSI_BONUS;
        } else {
            rsi = newRis;
        }

        emit RSIndexSet(newRis);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
