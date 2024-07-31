// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {Governed} from "../../../common/Governed/Governed.sol";
import {HydraChainConnector} from "../../../HydraChain/HydraChainConnector.sol";
import {IPrice} from "./IPrice.sol";

abstract contract Price is IPrice, Initializable, System, Governed, HydraChainConnector {
    uint256 public constant DENOMINATOR = 10000;
    bytes32 public constant MANAGER_ROLE = keccak256("manager_role");

    uint256 public updateTime;
    uint256 public latestDailyPrice;
    uint256 public priceSumCounter;
    uint256 public dailyPriceQuotesSum;
    uint256[] public updatedPrices;
    mapping(uint256 => uint256) public pricePerEpoch;

    // _______________ Initializer _______________

    function __Price_init(
        address _hydraChainAddr,
        address _governance,
        uint256[310] memory _prices
    ) internal onlyInitializing {
        __Governed_init(_governance);
        __HydraChainConnector_init(_hydraChainAddr);
        __Price_init_unchained(_prices);

        _grantRole(MANAGER_ROLE, _governance);
    }

    function __Price_init_unchained(uint256[310] memory _prices) internal onlyInitializing {
        updateTime = _calcNextMidnight();
        updatedPrices = _prices;
        latestDailyPrice = _prices[309];
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

    // _______________ Internal functions _______________

    /**
     * @notice Triggers bonus updates based on the price.
     */
    function _onPriceUpdate(uint256 _price) internal virtual;

    // _______________ Private functions _______________

    /**
     * @notice Update the price and time for the next update.
     * @dev It also triggers the macro factor update if not disabled.
     */
    function _updatePrice() private {
        uint256 price = dailyPriceQuotesSum / priceSumCounter;
        updateTime = _calcNextMidnight();
        latestDailyPrice = price;
        updatedPrices.push(price);

        // if (!disableRSI) {
        //     _triggerRSIUpdate();
        // }

        emit PriceUpdated(block.timestamp, price);

        _onPriceUpdate(price);
    }

    /**
     * @notice Calculate the next midnight timestamp.
     */
    function _calcNextMidnight() private view returns (uint256) {
        return block.timestamp + (1 days - (block.timestamp % 1 days));
    }

    /**
     * @notice Trigger the RSI update.
     */
    function _triggerRSIUpdate() private {
        console.log("updatedPrices");
        uint256 gain;
        uint256 loss;
        uint256 arrLenght = updatedPrices.length;
        console.log("entering rsi update", arrLenght);
        if (arrLenght > 15) {
            if (updatedPrices[arrLenght - 1] > updatedPrices[arrLenght - 2]) {
                averageGain = ((averageGain * 13) + (updatedPrices[arrLenght - 1] - updatedPrices[arrLenght - 2])) / 14;
                averageLoss = (averageLoss * 13) / 14;
            } else {
                averageLoss = ((averageLoss * 13) + (updatedPrices[arrLenght - 2] - updatedPrices[arrLenght - 1])) / 14;
                averageGain = (averageGain * 13) / 14;
            }
        } else if (arrLenght == 15) {
            for (uint256 i = 1; i < arrLenght; i++) {
                if (updatedPrices[i] > updatedPrices[i - 1]) {
                    console.log("gain", updatedPrices[i], updatedPrices[i - 1]);
                    gain += updatedPrices[i] - updatedPrices[i - 1];
                } else {
                    console.log("loss", updatedPrices[i], updatedPrices[i - 1]);
                    loss += updatedPrices[i - 1] - updatedPrices[i];
                }
            }
            averageGain = gain / 14;
            averageLoss = loss / 14;
        } else {
            return;
        }

        _calcRSI();
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
