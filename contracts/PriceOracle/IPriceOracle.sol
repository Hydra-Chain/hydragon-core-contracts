// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct PriceForValidator {
    uint256 price;
    address validator;
}

interface IPriceOracle {
    event PriceVoted(uint256 price, address validator, uint256 day);
    event PriceUpdated(uint256 price, uint256 day);

    error AlreadyVoted();
    error PriceAlreadySet();

    /**
     * @notice Allows active validators to vote on the price
     * @dev it automatically updates the price if all conditions are met
     * @param _price Price to vote
     */
    function vote(uint256 _price) external;
}
