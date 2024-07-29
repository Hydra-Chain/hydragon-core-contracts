// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {HydraChainConnector} from "../../../HydraChain/HydraChainConnector.sol";
import {System} from "../../../common/System/System.sol";
import {IPrice} from "./IPrice.sol";

abstract contract Price is IPrice, Initializable, System, HydraChainConnector {
    uint256 public updateTime;
    uint256 public latestDailyPrice;
    uint256 public priceSumCounter;
    uint256 public dailyPriceQuotesSum;
    mapping(uint256 => uint256) public pricePerEpoch;

    // _______________ Initializer _______________

    function __Price_init(address _hydraChainAddr, uint256 _initialPrice) internal onlyInitializing {
        __HydraChainConnector_init(_hydraChainAddr);
        __Price_init_unchained(_initialPrice);
    }

    function __Price_init_unchained(uint256 _initialPrice) internal onlyInitializing {
        updateTime = block.timestamp + 1 days;
        latestDailyPrice = _initialPrice;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IPrice
     */
    function quotePrice(uint256 _price) external onlySystemCall {
        uint256 currentEpochId = hydraChainContract.getCurrentEpochId();
        if (pricePerEpoch[currentEpochId] != 0) {
            revert PriceAlreadyQuoted();
        }
        
        pricePerEpoch[currentEpochId] = _price;
        if (block.timestamp > updateTime) {
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

    function _updatePrice() private {
        latestDailyPrice = dailyPriceQuotesSum / priceSumCounter;
        updateTime += 1 days;

        emit PriceUpdated(block.timestamp, latestDailyPrice);
    }
}
