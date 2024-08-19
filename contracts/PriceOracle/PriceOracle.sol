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

    uint256 public votingPowerPercentageNeeded;

    // _______________ Initializer _______________

    function initialize(address _hydraChainAddr, address _aprCalculatorAddr) external initializer onlySystemCall {
        __HydraChainConnector_init(_hydraChainAddr);
        __APRCalculatorConnector_init(_aprCalculatorAddr);
        _initialize();
    }

    function _initialize() private onlyInitializing {
        votingPowerPercentageNeeded = 61;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IPriceOracle
     */
    function vote(uint256 price) external {
        if (price == 0) {
            revert InvalidPrice();
        }

        uint256 day = _getCurrentDay();

        (bool canVote, string memory errMsg) = shouldVote(day);
        if (!canVote) {
            revert InvalidVote(errMsg);
        }

        validatorLastVotedDay[msg.sender] = day;

        PriceForValidator memory priceForValidator = PriceForValidator({price: price, validator: msg.sender});
        priceVotesForDay[day].push(priceForValidator);

        emit PriceVoted(price, msg.sender, day);

        uint256 availablePrice = _checkPriceUpdateAvailability(day);

        if (availablePrice != 0) {
            _updatePrice(availablePrice, day);
        }
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IPriceOracle
     */
    function shouldVote(uint256 day) public view returns (bool, string memory) {
        if (hydraChainContract.isValidatorActive(msg.sender) == false) {
            return (false, "INACTIVE_STAKER");
        }

        if (pricePerDay[day] != 0) {
            return (false, "PRICE_ALREADY_SET");
        }

        if (validatorLastVotedDay[msg.sender] == day) {
            return (false, "ALREADY_VOTED");
        }

        return (true, "");
    }

    // _______________ Internal functions _______________

    /**
     * @notice Check if the price update is available for the given day
     * @param day Day to check
     * @return uint256 Price if available, 0 otherwise
     */
    function _checkPriceUpdateAvailability(uint256 day) internal view returns (uint256) {
        PriceForValidator[] memory prices = priceVotesForDay[day];
        uint256 len = prices.length;

        if (len < 4) {
            return 0; // Not enough votes to determine
        }

        uint256 neededVotingPower = (hydraChainContract.getTotalVotingPower() * votingPowerPercentageNeeded) / 100;

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
        uint256 baseIndex = 0;
        uint256 basePrice = 0;
        uint256 totalPrice = 0;
        uint256 count = 0;
        uint256 powerSum = 0;
        for (uint256 i = 0; i < len; i++) {
            uint256 currentPriceIndex = prices[i].price;
            if (currentPriceIndex > (basePrice * 101) / 100) {
                bool prevousIndexFound = false;
                // Check if there is a previous index that is within 1% range with the current price index
                if (count > 2) {
                    for (uint256 j = baseIndex + 1; j < i; j++) {
                        if (currentPriceIndex <= (prices[j].price * 101) / 100) {
                            prevousIndexFound = true;
                            count = 1;
                            baseIndex = j;
                            basePrice = prices[j].price;
                            totalPrice = prices[j].price;
                            powerSum = hydraChainContract.getValidatorPower(prices[j].validator);
                            break;
                        }
                    }
                }

                if (!prevousIndexFound) {
                    // If price all previous prices are outside 1% range, start a new group
                    count = 1;
                    baseIndex = i;
                    basePrice = currentPriceIndex;
                    totalPrice = currentPriceIndex;
                    powerSum = hydraChainContract.getValidatorPower(prices[i].validator);
                }
            } else {
                // If price is within 1% range, add it to the group
                count++;
                totalPrice += currentPriceIndex;
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
     * @param price Price to be updated
     */
    function _updatePrice(uint256 price, uint256 day) private {
        try aprCalculatorContract.updatePrice(price, day) {
            pricePerDay[day] = price;
            emit PriceUpdated(price, day);
        } catch (bytes memory error) {
            emit PriceUpdateFailed(price, day, error);
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
