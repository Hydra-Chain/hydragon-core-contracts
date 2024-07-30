// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IPrice {
    event PriceQuoted(uint256 indexed epochId, uint256 amount);
    event PriceUpdated(uint256 time,uint256 price);

    error PriceAlreadyQuoted();
    error InvalidPrice();

    /**
     * @notice Quotes the price for each epoch & keeps the average price for each day
     * @dev only the system can call this function
     * @param price the amount to quote
     */
    function quotePrice(uint256 price) external;
}