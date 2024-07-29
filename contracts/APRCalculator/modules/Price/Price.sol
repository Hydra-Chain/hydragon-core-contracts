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

    function __Price_init(address _hydraChainAddr, uint256 _initialPrice) internal onlyInitializing {
        __HydraChainConnector_init(_hydraChainAddr);
        __Price_init_unchained(_initialPrice);
    }

    function __Price_init_unchained(uint256 _initialPrice) internal onlyInitializing {
        updateTime = block.timestamp + 1 days;
        currentPrice = _initialPrice;
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
            priceSumThreshold = _price;
            priceSumCounter = 1;
        } else {
            priceSumThreshold += _price;
            priceSumCounter++;
        }

        emit PriceQuoted(currentEpochId, _price);
    }

    // _______________ Private functions _______________

    function _updatePrice() private {
        currentPrice = priceSumThreshold / priceSumCounter;
        updateTime += 1 days;

        emit PriceUpdated(block.timestamp, currentPrice);
    }
}