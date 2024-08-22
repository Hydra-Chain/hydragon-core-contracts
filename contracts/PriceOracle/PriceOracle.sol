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

    uint256 public constant VOTING_POWER_PERCENTAGE_NEEDED = 61;
    uint256 public constant DAILY_VOTING_START_TIME = 36 * 1 minutes; // 36 minutes in seconds
    uint256 public constant DAILY_VOTING_END_TIME = DAILY_VOTING_START_TIME + (3 hours); // + 3 hours in seconds

    // _______________ Initializer _______________

    function initialize(address _hydraChainAddr, address _aprCalculatorAddr) external initializer onlySystemCall {
        __HydraChainConnector_init(_hydraChainAddr);
        __APRCalculatorConnector_init(_aprCalculatorAddr);
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

        uint256 availablePrice = _calcPriceWithQuorum(day);

        if (availablePrice != 0) {
            _updatePrice(availablePrice, day);
        }
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IPriceOracle
     */
    function shouldVote(uint256 day) public view returns (bool, string memory) {
        uint256 secondsInADay = _secondsPassedToday();
        if (secondsInADay < DAILY_VOTING_START_TIME || secondsInADay > DAILY_VOTING_END_TIME) {
            return (false, "NOT_VOTING_TIME");
        }

        if (hydraChainContract.getValidatorPower(msg.sender) == 0) {
            return (false, "NOT_VALIDATOR");
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
    function _calcPriceWithQuorum(uint256 day) internal view returns (uint256) {
        PriceForValidator[] memory prices = priceVotesForDay[day];
        uint256 len = prices.length;

        if (len < 4) {
            return 0; // Not enough votes to determine
        }

        uint256 neededVotingPower = (hydraChainContract.getTotalVotingPower() * VOTING_POWER_PERCENTAGE_NEEDED) / 100;

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
        uint256 count = 1; // set to 1 to avoid division by 0
        uint256 sumPrice = 0;
        uint256 powerSum = 0;
        for (uint256 i = 0; i < len; i++) {
            uint256 currentPriceIndex = prices[i].price;
            if (currentPriceIndex > ((sumPrice / count) * 101) / 100) {
                // If price is outside 1% range, start a new group
                count = 1;
                sumPrice = currentPriceIndex;
                powerSum = hydraChainContract.getValidatorPower(prices[i].validator);
            } else {
                // If price is within 1% range, add it to the group
                count++;
                sumPrice += currentPriceIndex;
                powerSum += hydraChainContract.getValidatorPower(prices[i].validator);
            }

            if (powerSum >= neededVotingPower) {
                return sumPrice / count; // Return the average price of the group
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

    /**
     * @notice Get the passed seconds for the current day
     * @return uint256 Passed seconds
     */
    function _secondsPassedToday() private view returns (uint256) {
        return block.timestamp % 1 days;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
