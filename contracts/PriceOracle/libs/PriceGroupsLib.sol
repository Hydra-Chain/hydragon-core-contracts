// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {PriceGroup} from "./IPriceGroupsLib.sol";

/**
 * @title PriceGroupsLib Library
 * @author Samuil Borisov
 * @notice Library for inserting a validator with a price in groups, based on the price consensus
 */
library PriceGroupsLib {
    /**
     * @notice Inserts a new validator with a price in a group
     * @param self The groups to insert the validator in
     * @param validator The validator to insert
     * @param price The price to insert
     * @dev Creates groups, where validators whose prices are within 1% of the average price are grouped together
     * @dev Make sure to check if validator has already voted before calling the function (in our case, this is done in the vote function)
     */
    function insert(PriceGroup[] storage self, address validator, uint256 price) internal {
        bool groupFound = false;
        uint256 groupsLength = self.length;

        // Iterate through all existing groups to find a fitting one
        for (uint256 i = 0; i < groupsLength; i++) {
            PriceGroup storage group = self[i];
            uint256 averagePrice = group.sumPrice / group.validators.length;

            // Check if the price fits into this group (within 1% difference)
            if (price >= (averagePrice * 99) / 100 && price <= (averagePrice * 101) / 100) {
                group.sumPrice += price;
                group.validators.push(validator);
                groupFound = true;
                break;
            }
        }

        // If no fitting group was found, create a new one
        if (!groupFound) {
            // Create a new group with the validator
            PriceGroup memory newGroup = PriceGroup(price, new address[](1));
            newGroup.validators[0] = validator;

            // Push the new group into storage
            self.push(newGroup);
        }
    }

    /**
     * @notice Returns all price groups with their aggregated data
     * @param self The groups to get the price groups from
     * @return groups An array of PriceGroup structs
     */
    function getAllGroups(PriceGroup[] storage self) internal view returns (PriceGroup[] memory groups) {
        groups = new PriceGroup[](self.length);
        uint256 groupsLength = self.length;
        for (uint256 i = 0; i < groupsLength; i++) {
            groups[i] = self[i];
        }
        return groups;
    }

    /**
     * @notice Returns the total number of validators that voted
     * @param self The groups to get the total number of validators from
     * @return totalVotedValidators The total number of validators that voted
     */
    function getTotalValidators(PriceGroup[] storage self) internal view returns (uint256) {
        uint256 totalVotedValidators = 0;
        uint256 groupsLength = self.length;
        for (uint256 i = 0; i < groupsLength; i++) {
            totalVotedValidators += self[i].validators.length;
        }
        return totalVotedValidators;
    }
}
