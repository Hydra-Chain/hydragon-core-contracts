// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @notice data type for the price group
 * @param sumPrice the sum of all prices from validators in the group
 * @param validators array of validators in the group
 */
struct PriceGroup {
    uint256 sumPrice;
    address[] validators;
}
