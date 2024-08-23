// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct ValidatorPrice {
    address validator;
    uint256 price;
}

/**
 * @title SortedPriceList Library
 * @author Samuil Borisov
 * @notice library for inserting a validator with a price in a sorted list
 */
library SortedPriceList {
    struct Node {
        uint256 price;
        address next;
    }

    struct List {
        mapping(address => Node) nodes;
        address head;
        uint256 size;
    }

    /**
     * @notice Inserts a new validator with a price in the sorted list
     * @param self The list to insert the validator in
     * @param validator The validator to insert
     * @param price The price to insert
     * @dev The list is sorted in ascending order
     */
    function insert(List storage self, address validator, uint256 price) internal {
        assert(price != 0);
        assert(validator != address(0));
        assert(self.nodes[validator].price == 0);

        // Create a new node
        Node memory newNode = Node(price, address(0));

        // If the new price is smaller or equal to the head, insert at the head (or if the list is empty)
        if (self.nodes[self.head].price >= price || self.size == 0) {
            newNode.next = self.head;
            self.head = validator;
            self.nodes[validator] = newNode;
            self.size++;
            return;
        }

        // Find the correct spot to insert the new node
        address current = self.head;
        while (self.nodes[current].next != address(0) && price > self.nodes[self.nodes[current].next].price) {
            current = self.nodes[current].next;
        }

        // Insert the new node
        newNode.next = self.nodes[current].next;
        self.nodes[current].next = validator;
        self.nodes[validator] = newNode;
        self.size++;
    }

    /**
     * @notice Returns all validators with their prices in the list
     * @param self The list to get the validators from
     * @return validatorPrices An array of ValidatorPrice structs
     */
    function getAll(List storage self) internal view returns (ValidatorPrice[] memory validatorPrices) {
        validatorPrices = new ValidatorPrice[](self.size);
        address current = self.head;
        uint256 index = 0;

        while (current != address(0)) {
            validatorPrices[index] = ValidatorPrice(current, self.nodes[current].price);
            current = self.nodes[current].next;
            index++;
        }

        return validatorPrices;
    }
}
