// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct PriceGroup {
    uint256 sumPrice;
    uint256 count;
    address[] validators;
}

/**
 * @title PriceGroups Library
 * @author Samuil Borisov
 * @notice Library for inserting a validator with a price in groups, based on the price consensus
 */
library PriceGroups {
    struct Groups {
        PriceGroup[] groups;
        uint256 votedValidators; // Total number of validators
    }

    /**
     * @notice Inserts a new validator with a price in a group
     * @param self The groups to insert the validator in
     * @param validator The validator to insert
     * @param price The price to insert
     * @dev Creates groups, where validators whose prices are within 1% of the average price are grouped together
     */
    function insert(Groups storage self, address validator, uint256 price) internal {
        // assert(price != 0);  // This is not needed, as the price is already checked in the calling function
        // assert(validator != address(0)); // This is not needed, as the validator is the msg.sender, who should always be a valid address
        /// @dev There is not check if validator is already in the groups, make sure to check before calling this function

        bool groupFound = false;
        uint256 groupsLength = self.groups.length;

        // Iterate through all existing groups to find a fitting one
        for (uint256 i = 0; i < groupsLength; i++) {
            PriceGroup storage group = self.groups[i];
            uint256 averagePrice = group.sumPrice / group.count;

            // Check if the price fits into this group (within 1% difference)
            if (price >= (averagePrice * 99) / 100 && price <= (averagePrice * 101) / 100) {
                group.sumPrice += price;
                unchecked {
                    group.count++; // Max validators in our case is 150, so no need to check for overflow
                }
                group.validators.push(validator);
                groupFound = true;
                break;
            }
        }

        // If no fitting group was found, create a new one
        if (!groupFound) {
            // Create a new group with the validator
            PriceGroup memory newGroup = PriceGroup(price, 1, new address[](1));
            newGroup.validators[0] = validator;

            // Push the new group into storage
            self.groups.push(newGroup);
        }

        // Update the total size of validators
        unchecked {
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
