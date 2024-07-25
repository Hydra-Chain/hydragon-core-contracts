// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {HydraChainConnector} from "../../../HydraChain/HydraChainConnector.sol";
import {System} from "../../../common/System/System.sol";
import {IPrice} from "./IPrice.sol";

abstract contract Price is IPrice, Initializable, System, HydraChainConnector {
    uint256 public updateTime;
    uint256 public currentPrice;
    uint256 public priceSumCounter;
    uint256 public priceSumThreshold;
    mapping(uint256 => uint256) public pricePerEpoch;

    // _______________ Initializer _______________

    function __Price_init(address _hydraChainAddr) internal onlyInitializing {
        __HydraChainConnector_init(_hydraChainAddr);
        __Price_init_unchained();
    }

    function __Price_init_unchained() internal onlyInitializing {
        updateTime = block.timestamp + 1 days;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IPrice
     */
    function quotePrice(uint256 _price) external onlySystemCall {
        uint256 currentEpochId = hydraChainContract.getCurrentEpochId();
        require(pricePerEpoch[currentEpochId] == 0, "PRICE_FOR_EPOCH_ALREADY_QUOTED");

        pricePerEpoch[currentEpochId] = _price;
        priceSumThreshold += _price;
        priceSumCounter++;

        if (block.timestamp > updateTime) {
            _updatePrice();
        }

        emit PriceQuoted(currentEpochId, _price);
    }

    // _______________ Private functions _______________

    function _updatePrice() private {
        currentPrice = priceSumThreshold / priceSumCounter;

        priceSumThreshold = 0;
        priceSumCounter = 0;
        updateTime += 1 days;

        emit PriceUpdated(block.timestamp, currentPrice);
    }
}
