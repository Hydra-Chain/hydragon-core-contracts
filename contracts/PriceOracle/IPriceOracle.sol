// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct PriceForValidator {
    uint256 price;
    address validator;
}

interface IPriceOracle {
    event PriceVoted(uint256 price, address validator, uint256 day);
    event PriceUpdateFailed(uint256 price, uint256 day, bytes data);
    event PriceUpdated(uint256 price, uint256 day);

    error InvalidPrice();
    error AlreadyVoted();
    error PriceAlreadySet();

    /**
     * @notice Allows active validators to vote on the price
     * @dev it automatically updates the price if all conditions are met
     * @param price Price to vote
     */
    function vote(uint256 price) external;

    // _______________ Public functions _______________

    /**
     * @notice Returns true if the validator can vote for the provided day
     * @param day The day to check
     * @return true if the validator can vote
     */
    function isValidValidatorVote(uint256 day) external view returns (bool);
}
