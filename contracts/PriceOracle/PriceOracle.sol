// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {IPriceOracle} from "./IPriceOracle.sol";
import {SortedPriceList, ValidatorPrice} from "./SortedPriceList.sol";

/**
 * @title PriceOracle
 * @dev This contract will be responsible for the price updates.
 * Active validators will be able to vote and agree on the price.
 */
contract PriceOracle is IPriceOracle, System, Initializable, HydraChainConnector, APRCalculatorConnector {
    using SortedPriceList for SortedPriceList.List;
    mapping(uint256 => SortedPriceList.List) public priceVotesForDay;
    mapping(address => uint256) public validatorLastVotedDay;
    mapping(uint256 => uint256) public pricePerDay;

    uint256 public constant VOTING_POWER_PERCENTAGE_NEEDED = 61;
    uint256 public constant DAILY_VOTING_START_TIME = 36 minutes; // 36 minutes in seconds
    uint256 public constant DAILY_VOTING_END_TIME = DAILY_VOTING_START_TIME + 3 hours; // start time + 3 hours in seconds

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
        priceVotesForDay[day].insert(msg.sender, price);

        emit PriceVoted(price, msg.sender, day);

        uint256 availablePrice = _calcPriceWithQuorum(day);

        if (availablePrice != 0) {
            _updatePrice(availablePrice, day);
        }
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function getVotesForDay(uint256 day) external view returns (ValidatorPrice[] memory) {
        return priceVotesForDay[day].getAll();
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IPriceOracle
     */
    function shouldVote(uint256 day) public view returns (bool, string memory) {
        uint256 secondsPassed = _secondsPassedToday();
        if (secondsPassed < DAILY_VOTING_START_TIME || secondsPassed > DAILY_VOTING_END_TIME) {
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
        SortedPriceList.List storage priceList = priceVotesForDay[day];

        if (priceList.size < 4) {
            return 0; // Not enough votes to determine
        }

        uint256 neededVotingPower = (hydraChainContract.getTotalVotingPower() * VOTING_POWER_PERCENTAGE_NEEDED) / 100;

        // Iterate through the sorted list directly
        address current = priceList.head;
        uint256 count = 1;
        uint256 sumPrice = 0;
        uint256 powerSum = 0;

        while (current != address(0)) {
            uint256 currentPrice = priceList.nodes[current].price;

            // Check if price is outside 1% range and start a new group
            if (currentPrice > ((sumPrice / count) * 101) / 100) {
                count = 1;
                sumPrice = currentPrice;
                powerSum = hydraChainContract.getValidatorPower(current);
            } else {
                count++;
                sumPrice += currentPrice;
                powerSum += hydraChainContract.getValidatorPower(current);
            }

            // Check if quorum is reached
            if (powerSum >= neededVotingPower) {
                return sumPrice / count;
            }

            current = priceList.nodes[current].next;
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
