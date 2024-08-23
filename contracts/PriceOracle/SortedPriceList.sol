// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct PriceGroup {
    uint256 sumPrice;
    uint256 count;
    address[] validators;
}

/**
 * @title SortedPriceList Library
 * @author Samuil Borisov
 * @notice Library for inserting a validator with a price in a sorted list, grouped by price within 1%
 */
library SortedPriceList {
    struct List {
        PriceGroup[] groups;
        uint256 size; // Total number of validators
    }

    /**
     * @notice Inserts a new validator with a price in the sorted list
     * @param self The list to insert the validator in
     * @param validator The validator to insert
     * @param price The price to insert
     * @dev The list groups validators whose prices are within 1% of each other
     */
    function insert(List storage self, address validator, uint256 price) internal {
        assert(price != 0);
        assert(validator != address(0));
        /// @dev There is not check if validator is already in the list, make sure to check before calling this function

        bool groupFound = false;

        // Iterate through all existing groups to find a fitting one
        for (uint256 i = 0; i < self.groups.length; i++) {
            PriceGroup storage group = self.groups[i];
            uint256 averagePrice = group.sumPrice / group.count;

            // Check if the price fits into this group (within 1% difference)
            if (price <= (averagePrice * 101) / 100 && price >= (averagePrice * 99) / 100) {
                group.sumPrice += price;
                group.count++;
                group.validators.push(validator);
                groupFound = true;
                break;
            }
        }

        // If no fitting group was found, create a new one
        if (!groupFound) {
            self.groups.push(PriceGroup(price, 1, new address[](0)));
            self.groups[self.groups.length - 1].validators.push(validator);
        }

        self.size++;
    }

    /**
     * @notice Returns all price groups with their aggregated data
     * @param self The list to get the price groups from
     * @return groups An array of PriceGroup structs
     */
    function getAllGroups(List storage self) internal view returns (PriceGroup[] memory groups) {
        groups = new PriceGroup[](self.groups.length);
        for (uint256 i = 0; i < self.groups.length; i++) {
            groups[i] = self.groups[i];
        }
        return groups;
    }
}
