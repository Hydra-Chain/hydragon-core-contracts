// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {IPriceOracle} from "./IPriceOracle.sol";
import {SortedList, ValidatorPrice} from "./SortedList.sol";

/**
 * @title PriceOracle
 * @dev This contract will be responsible for the price updates.
 * Active validators will be able to vote and agree on the price.
 */
contract PriceOracle is IPriceOracle, System, Initializable, HydraChainConnector, APRCalculatorConnector {
    using SortedList for SortedList.List;
    mapping(uint256 => ValidatorPrice[]) public priceVotesForDayLegacy;
    mapping(uint256 => SortedList.List) public priceVotesForDay;
    mapping(address => uint256) public validatorLastVotedDay;
    mapping(uint256 => uint256) public pricePerDay;

    // Choose algorithm version: 0(List), 1(Bubble Sort), 2(QuickSort), 3(MergeSort)
    uint8 public constant LEGACY_VERSION = 3;
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

        if (LEGACY_VERSION == 0) {
            priceVotesForDay[day].insert(msg.sender, price);
        } else {
            priceVotesForDayLegacy[day].push(ValidatorPrice({validator: msg.sender, price: price}));
        }

        emit PriceVoted(price, msg.sender, day);

        uint256 availablePrice;
        if (LEGACY_VERSION == 0) {
            availablePrice = _calcPriceWithQuorum(day);
        } else {
            availablePrice = _calcPriceWithQuorumLegacy(day);
        }

        if (availablePrice != 0) {
            _updatePrice(availablePrice, day);
        }
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
        SortedList.List storage priceList = priceVotesForDay[day];

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

    // ________________________________ Legacy version ________________________________

    function _calcPriceWithQuorumLegacy(uint256 day) internal view returns (uint256) {
        ValidatorPrice[] memory prices = priceVotesForDayLegacy[day];
        uint256 len = prices.length;

        if (len < 4) {
            return 0; // Not enough votes to determine
        }

        uint256 neededVotingPower = (hydraChainContract.getTotalVotingPower() * VOTING_POWER_PERCENTAGE_NEEDED) / 100;

        if (LEGACY_VERSION == 1) {
            // Sort prices in ascending order using BubbleSort
            for (uint256 i = 0; i < len - 1; i++) {
                for (uint256 j = i + 1; j < len; j++) {
                    if (prices[i].price > prices[j].price) {
                        ValidatorPrice memory temp = prices[i];
                        prices[i] = prices[j];
                        prices[j] = temp;
                    }
                }
            }
        } else if (LEGACY_VERSION == 2) {
            // Sort prices in ascending order using QuickSort
            quickSort(prices, int(0), int(len - 1));
        } else if (LEGACY_VERSION == 3) {
            // Sort prices in ascending order using MergeSort
            prices = mergeSort(prices);
        } else {
            return 0;
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

    // _______________ QuickSort _______________

    function quickSort(ValidatorPrice[] memory arr, int left, int right) internal pure {
        int i = left;
        int j = right;
        if (i == j) return;
        uint256 pivot = arr[uint(left + (right - left) / 2)].price;
        while (i <= j) {
            while (arr[uint(i)].price < pivot) i++;
            while (pivot < arr[uint(j)].price) j--;
            if (i <= j) {
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++;
                j--;
            }
        }
        if (left < j) quickSort(arr, left, j);
        if (i < right) quickSort(arr, i, right);
    }

    // _______________ MergeSort _______________

    function mergeSort(ValidatorPrice[] memory arr) internal pure returns (ValidatorPrice[] memory) {
        if (arr.length <= 1) {
            return arr;
        }

        uint256 mid = arr.length / 2;
        ValidatorPrice[] memory left = new ValidatorPrice[](mid);
        ValidatorPrice[] memory right = new ValidatorPrice[](arr.length - mid);

        for (uint256 i = 0; i < mid; i++) {
            left[i] = arr[i];
        }
        for (uint256 i = mid; i < arr.length; i++) {
            right[i - mid] = arr[i];
        }

        return merge(mergeSort(left), mergeSort(right));
    }

    function merge(
        ValidatorPrice[] memory left,
        ValidatorPrice[] memory right
    ) internal pure returns (ValidatorPrice[] memory) {
        ValidatorPrice[] memory result = new ValidatorPrice[](left.length + right.length);
        uint256 i = 0;
        uint256 j = 0;
        uint256 k = 0;

        while (i < left.length && j < right.length) {
            if (left[i].price <= right[j].price) {
                result[k] = left[i];
                i++;
            } else {
                result[k] = right[j];
                j++;
            }
            k++;
        }

        while (i < left.length) {
            result[k] = left[i];
            i++;
            k++;
        }

        while (j < right.length) {
            result[k] = right[j];
            j++;
            k++;
        }

        return result;
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
