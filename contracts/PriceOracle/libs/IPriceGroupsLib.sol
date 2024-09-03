// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @notice data type for managing the price groups
 * @param groups array of price groups
 * @param votedValidators number of total validators that voted
 *
 */
struct Groups {
    PriceGroup[] groups;
    uint256 votedValidators;
}

/**
 * @notice data type for the price group
 * @param sumPrice the sum of all prices from validators in the group
 * @param validators array of validators in the group
 */
struct PriceGroup {
    uint256 sumPrice;
    address[] validators;
}
