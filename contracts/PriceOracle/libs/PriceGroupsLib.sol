// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Groups, PriceGroup} from "./IPriceGroupsLib.sol";

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
     * You can add "hasVoted" mapping to the Group struct, and check if the validator has already voted
     */
    function insert(Groups storage self, address validator, uint256 price) internal {
        // assert(validator != address(0)); // This is not needed, as the validator is the msg.sender, who should always be a valid address

        bool groupFound = false;
        uint256 groupsLength = self.groups.length;

        // Iterate through all existing groups to find a fitting one
        for (uint256 i = 0; i < groupsLength; i++) {
            PriceGroup storage group = self.groups[i];
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
            self.groups.push(newGroup);
        }

        // Update the total count of validators
        unchecked {
            // TODO: (active validators could change during voting time) make sure no vunerabilities come from this!
            self.votedValidators++; // Max validators in our case is 150, so no need to check for overflow
        }
    }

    /**
     * @notice Returns all price groups with their aggregated data
     * @param self The groups to get the price groups from
     * @return groups An array of PriceGroup structs
     */
    function getAllGroups(Groups storage self) internal view returns (PriceGroup[] memory groups) {
        groups = new PriceGroup[](self.groups.length);
        uint256 groupsLength = self.groups.length;
        for (uint256 i = 0; i < groupsLength; i++) {
            groups[i] = self.groups[i];
        }
        return groups;
    }
}
