// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ValidatorPrice, List, Node} from "./ISortedPriceList.sol";

/**
 * @title SortedPriceList Library
 * @author Samuil Borisov
 * @notice library for inserting a validator with a price in a sorted list
 */
library SortedPriceList {
    /**
     * @notice Inserts a new validator with a price in the sorted list
     * @param self The list to insert the validator in
     * @param validator The validator to insert
     * @param price The price to insert
     * @dev The list is sorted in ascending order
     * @dev To make sure it works correctly, the price should be greater than 0, and the validator should not have been inserted before (his price should be 0)!
     * (in our case, we are making those checks in the vote function)
     */
    function insert(List storage self, address validator, uint256 price) internal {
        assert(validator != address(0));

        // Create a new node
        Node memory newNode = Node(price, address(0));
        address current = self.head;

        // If the new price is smaller or equal to the head, insert at the head (or if the list is empty)
        if (self.nodes[current].price >= price || current == address(0)) {
            newNode.next = current;
            self.head = validator;
            self.nodes[validator] = newNode;
            self.size++;

            return;
        }

        address next = getNext(self, current);
        // Find the correct spot to insert the new node
        while (next != address(0) && price > self.nodes[next].price) {
            current = getNext(self, current); // change the current node to the next one
            next = getNext(self, current); // take the next node for updated current
        }

        // Insert the new node
        newNode.next = next;
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
            current = getNext(self, current);
            index++;
        }

        return validatorPrices;
    }

    /**
     * @notice Returns the next validator in the list
     * @param self The list to get the next validator from
     * @param current The current validator
     * @return address The next validator
     */
    function getNext(List storage self, address current) internal view returns (address) {
        return self.nodes[current].next;
    }
}
