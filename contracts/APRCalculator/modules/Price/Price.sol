// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {HydraChainConnector} from "../../../HydraChain/HydraChainConnector.sol";
import {System} from "../../../common/System/System.sol";
import {MacroFactor} from "../MacroFactor/MacroFactor.sol";
import {IPrice} from "./IPrice.sol";

abstract contract Price is IPrice, HydraChainConnector, MacroFactor {
    uint256 public updateTime;
    uint256 public latestDailyPrice;
    uint256 public priceSumCounter;
    uint256 public dailyPriceQuotesSum;
    mapping(uint256 => uint256) public pricePerEpoch;

    // _______________ Initializer _______________

    function __Price_init(address _hydraChainAddr, uint256 _initialPrice) internal onlyInitializing {
        __HydraChainConnector_init(_hydraChainAddr);
        __MacroFactor_init();
        __Price_init_unchained(_initialPrice);
    }

    function __Price_init_unchained(uint256 _initialPrice) internal onlyInitializing {
        updateTime = _calcNextMidnight();
        latestDailyPrice = _initialPrice;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IPrice
     */
    function quotePrice(uint256 _price) external onlySystemCall {
        if (_price == 0) {
            revert InvalidPrice();
        }

        uint256 currentEpochId = hydraChainContract.getCurrentEpochId();
        if (pricePerEpoch[currentEpochId] != 0) {
            revert PriceAlreadyQuoted();
        }

        pricePerEpoch[currentEpochId] = _price;
        if (block.timestamp >= updateTime && priceSumCounter != 0) {
            _updatePrice();
            dailyPriceQuotesSum = _price;
            priceSumCounter = 1;
        } else {
            dailyPriceQuotesSum += _price;
            priceSumCounter++;
        }

        emit PriceQuoted(currentEpochId, _price);
    }

    // _______________ Private functions _______________

    /**
     * @notice Update the price and time for the next update.
     * @dev It also triggers the macro factor update if not disabled.
     */
    function _updatePrice() private {
        uint256 price = dailyPriceQuotesSum / priceSumCounter;
        updateTime = _calcNextMidnight();
        latestDailyPrice = price;

        if (!disabledMacro) {
            _triggerMacroUpdate(price);
        }

        emit PriceUpdated(block.timestamp, price);
    }

    /**
     * @notice Trigger the macro factor update.
     * @param _price The price to be used for the update.
     */
    function _triggerMacroUpdate(uint256 _price) private {
        updatedPrices.push(_price);
        smaFastSum += _price;
        smaSlowSum += _price;

        uint256 arrLenght = updatedPrices.length;
        if (arrLenght > SLOW_SMA) {
            smaFastSum -= updatedPrices[arrLenght - FAST_SMA];
            smaSlowSum -= updatedPrices[arrLenght - SLOW_SMA];
        } else if (arrLenght > FAST_SMA) {
            smaFastSum -= updatedPrices[arrLenght - FAST_SMA];
        }

        _calcSMA();
    }

    /**
     * @notice Calculate the next midnight timestamp.
     */
    function _calcNextMidnight() private view returns (uint256) {
        return block.timestamp + (1 days - (block.timestamp % 1 days));
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
