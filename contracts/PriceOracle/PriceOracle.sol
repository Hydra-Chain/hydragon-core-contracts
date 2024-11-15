// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../common/System/System.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {IPriceOracle} from "./IPriceOracle.sol";
import {ValidatorPrice, List} from "./libs/ISortedPriceList.sol";
import {SortedPriceList} from "./libs/SortedPriceList.sol";

/**
 * @title PriceOracle
 * @dev This contract will be responsible for the price updates.
 * Active validators will be able to vote and agree on the price.
 */
contract PriceOracle is IPriceOracle, System, Initializable, HydraChainConnector, APRCalculatorConnector {
    using SortedPriceList for List;
    mapping(uint256 => uint256) public pricePerDay;
    mapping(uint256 => List) public priceVotesForDay;

    uint256 constant MAX_UINT224 = type(uint224).max;
    uint256 public constant VOTING_POWER_PERCENTAGE_NEEDED = 61;
    uint256 public constant DAILY_VOTING_START_TIME = 36 minutes;
    uint256 public constant DAILY_VOTING_END_TIME = DAILY_VOTING_START_TIME + 3 hours;

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
        if (price == 0 || price > MAX_UINT224) {
            revert InvalidPrice();
        }

        uint256 day = _getCurrentDay();
        (bool canVote, string memory errMsg) = shouldVote(day);
        if (!canVote) {
            revert InvalidVote(errMsg);
        }

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

    /**
     * @inheritdoc IPriceOracle
     */
    function getNumberOfValidatorsVotedForDay(uint256 day) external view returns (uint256) {
        return priceVotesForDay[day].size;
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

        if (priceVotesForDay[day].nodes[msg.sender].price != 0) {
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
        List storage priceList = priceVotesForDay[day];

        uint256 neededVotingPower = (hydraChainContract.getTotalVotingPower() * VOTING_POWER_PERCENTAGE_NEEDED) / 100;

        // Iterate through the sorted list directly
        uint256 count = 1;
        uint256 powerSum = 0;
        uint256 sumPrice = 0;
        address current = priceList.head;

        while (current != address(0)) {
            uint256 currentPrice = priceList.nodes[current].price;
            uint256 validatorPower = hydraChainContract.getValidatorPower(current);

            if (validatorPower == 0) {
                current = priceList.getNext(current);
                continue;
            }

            // Check if price is outside 1% range and start a new group
            if (currentPrice > ((sumPrice / count) * 101) / 100) {
                count = 1;
                sumPrice = currentPrice;
                powerSum = validatorPower;
            } else {
                count++;
                sumPrice += currentPrice;
                powerSum += validatorPower;
            }

            // Check if quorum is reached: 3+ active validators agree on a price, and their power is enough
            if (count > 2 && powerSum >= neededVotingPower) {
                return sumPrice / count;
            }

            current = priceList.getNext(current);
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
        // slither-disable-next-line weak-prng
        return block.timestamp % 1 days;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
