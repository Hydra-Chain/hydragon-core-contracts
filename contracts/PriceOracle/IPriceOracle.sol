// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ValidatorPrice} from "./libs/ISortedPriceList.sol";

interface IPriceOracle {
    event PriceVoted(uint256 price, address validator, uint256 day);
    event PriceUpdateFailed(uint256 price, uint256 day, bytes data);
    event PriceUpdated(uint256 price, uint256 day);

    error InvalidVote(string message);
    error InvalidPrice();

    /**
     * @notice Allows active validators to vote on the price
     * @dev it automatically updates the price if all conditions are met
     * @param price Price to vote
     */
    function vote(uint256 price) external;

    /**
     * @notice Returns the votes for the provided day
     * @param day The day to get the votes
     * @return ValidatorPrice[] The votes for the provided day
     */
    function getVotesForDay(uint256 day) external view returns (ValidatorPrice[] memory);

    /**
     * @notice Returns number of validators voted for the provided day
     * @param day The day to get the number
     * @return uint256 The total number of validators voted
     */
    function getNumberOfValidatorsVotedForDay(uint256 day) external view returns (uint256);

    // _______________ Public functions _______________

    /**
     * @notice Returns true if the validator can vote for the provided day
     * @param day The day to check
     * @return true if the validator can vote
     * @return error message if the validator cannot vote
     */
    function shouldVote(uint256 day) external view returns (bool, string memory);
}
