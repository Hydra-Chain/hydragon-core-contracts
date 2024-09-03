// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {Groups, PriceGroup} from "./libs/IPriceGroupsLib.sol";
import {PriceGroupsLib} from "./libs/PriceGroupsLib.sol";
import {IPriceOracle} from "./IPriceOracle.sol";

/**
 * @title PriceOracle
 * @dev This contract will be responsible for the price updates.
 * Active validators will be able to vote and agree on the price.
 */
contract PriceOracle is IPriceOracle, System, Initializable, HydraChainConnector, APRCalculatorConnector {
    using PriceGroupsLib for Groups;
    mapping(uint256 => Groups) public priceVotesForDay;
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
    function getGroupVotesForDay(uint256 day) external view returns (PriceGroup[] memory) {
        return priceVotesForDay[day].getAllGroups();
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
        Groups storage priceGroups = priceVotesForDay[day];

        // If there are fewer than 4 validators, there isn't enough data to determine a price
        if (priceGroups.votedValidators < 4) {
            return 0;
        }

        // Calculate the needed voting power to reach quorum
        uint256 neededVotingPower = (hydraChainContract.getTotalVotingPower() * VOTING_POWER_PERCENTAGE_NEEDED) / 100;
        uint256 groupLength = priceGroups.groups.length;

        // Iterate through the price groups to find one that meets the quorum
        for (uint256 i = 0; i < groupLength; i++) {
            PriceGroup storage group = priceGroups.groups[i];
            uint256 powerSum = 0;
            uint256 groupValidatorsLength = group.validators.length;

            // Sum the voting power of all validators in the group
            for (uint256 j = 0; j < groupValidatorsLength; j++) {
                powerSum += hydraChainContract.getValidatorPower(group.validators[j]);
            }

            // If the power sum reaches or exceeds the needed voting power, return the average price
            if (powerSum >= neededVotingPower) {
                return group.sumPrice / groupValidatorsLength;
            }
        }

        // If no group meets the required voting power, return 0
        return 0;
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
