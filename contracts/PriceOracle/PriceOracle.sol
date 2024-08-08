// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {IPriceOracle, PriceForValidator} from "./IPriceOracle.sol";

/**
 * @title PriceOracle
 * @dev This contract will be responsible for the price updates.
 * Active validators will be able to vote and agree on the price.
 */
contract PriceOracle is IPriceOracle, System, Initializable, HydraChainConnector, APRCalculatorConnector {
    mapping(uint256 => PriceForValidator[]) public priceVotesForDay;
    mapping(address => uint256) public validatorLastVotedDay;
    mapping(uint256 => uint256) public pricePerDay;

    // _______________ Initializer _______________

    function initialize(address _hydraChainAddr, address _aprCalculatorAddr) external initializer onlySystemCall {
        __HydraChainConnector_init(_hydraChainAddr);
        __APRCalculatorConnector_init(_aprCalculatorAddr);
        _initialize();
    }

    function _initialize() private onlyInitializing {}

    // _______________ Modifers _______________

    modifier onlyActiveValidator() {
        if (hydraChainContract.isValidatorActive(msg.sender) == false) {
            revert Unauthorized("INACTIVE_STAKER");
        }
        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IPriceOracle
     */
    function vote(uint256 _price) external onlyActiveValidator {
        uint256 day = _getCurrentDay();
        if (_price == 0) {
            revert InvalidPrice();
        }

        if (pricePerDay[day] != 0) {
            revert PriceAlreadySet();
        }

        if (validatorLastVotedDay[msg.sender] == day) {
            revert AlreadyVoted();
        }

        validatorLastVotedDay[msg.sender] = day;

        PriceForValidator memory priceForValidator = PriceForValidator({price: _price, validator: msg.sender});
        priceVotesForDay[day].push(priceForValidator);

        emit PriceVoted(_price, msg.sender, day);

        uint256 price = _checkPriceUpdateAvaibility(day);

        if (price != 0) {
            _updatePrice(price, day);
        }
    }

    // _______________ Internal functions _______________

    /**
     * @notice Check if the price update is available for the given day
     * @param _day Day to check
     * @return uint256 Price if available, 0 otherwise
     */
    function _checkPriceUpdateAvaibility(uint256 _day) internal view returns (uint256) {
        PriceForValidator[] memory prices = priceVotesForDay[_day];
        uint256 len = prices.length;

        if (len < 4) {
            return 0; // Not enough votes to determine
        }

        uint256 neededVotingPower = (hydraChainContract.getTotalVotingPower() * 61) / 100;

        // Sort prices in ascending order
        for (uint256 i = 0; i < len - 1; i++) {
            for (uint256 j = i + 1; j < len; j++) {
                if (prices[i].price > prices[j].price) {
                    PriceForValidator memory temp = prices[i];
                    prices[i] = prices[j];
                    prices[j] = temp;
                }
            }
        }

        // Check for suitable price
        uint256 basePrice = 0;
        uint256 totalPrice = 0;
        uint256 count = 0;
        uint256 powerSum = 0;
        for (uint256 i = 0; i < len; i++) {
            if (prices[i].price > (basePrice * 101) / 100) {
                // If price is outside 1% range, start a new group
                count = 1;
                basePrice = prices[i].price;
                totalPrice = prices[i].price;
                powerSum = hydraChainContract.getValidatorPower(prices[i].validator);
            } else {
                count++;
                totalPrice += prices[i].price;
                powerSum += hydraChainContract.getValidatorPower(prices[i].validator);
            }

            if (powerSum >= neededVotingPower) {
                return totalPrice / count; // Return the average price of the group
            }
        }

        return 0; // No price meets the requirement
    }

    // _______________ Private functions _______________

    /**
     * @notice Updates the price for the given day by sending it to the APRCalculator
     * @param _price Price to be updated
     */
    function _updatePrice(uint256 _price, uint256 _day) private {
        pricePerDay[_day] = _price;
        // sami: should update price, not quote
        try aprCalculatorContract.quotePrice(_price) {
            emit PriceUpdated(_price, _day);
        } catch (bytes memory error) {
            emit PriceUpdated(_price, _day); // sami: remove this line when finish Price module update
            emit PriceUpdateFailed(_price, _day, error);
        }
    }

    /**
     * @notice Get the current day
     * @return uint256 Current day
     */
    function _getCurrentDay() private view returns (uint256) {
        return block.timestamp / 1 days;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
