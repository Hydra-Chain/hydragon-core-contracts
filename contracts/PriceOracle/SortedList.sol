// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

library SortedList {
    struct Node {
        uint256 price;
        address next;
    }

    struct List {
        mapping(address => Node) nodes;
        address head;
        uint256 size;  // Store the size of the list
    }

    struct UserPrice {
        address user;
        uint256 price;
    }

    function insert(List storage self, address user, uint256 price) internal {
        require(user != address(0), "Invalid address");

        // Create a new node
        Node memory newNode = Node(price, address(0));

        // If the list is empty, insert at the head
        if (self.head == address(0)) {
            self.head = user;
            self.nodes[user] = newNode;
            self.size++;
            return;
        }

        // If the new price is smaller than the head, insert at the head
        if (price < self.nodes[self.head].price) {
            newNode.next = self.head;
            self.head = user;
            self.nodes[user] = newNode;
            self.size++;
            return;
        }

        // Find the correct spot to insert the new node
        address current = self.head;
        while (self.nodes[current].next != address(0) && self.nodes[self.nodes[current].next].price < price) {
            current = self.nodes[current].next;
        }

        // Insert the new node
        newNode.next = self.nodes[current].next;
        self.nodes[current].next = user;
        self.nodes[user] = newNode;
        self.size++;
    }

    function getAll(List storage self) internal view returns (UserPrice[] memory) {
        UserPrice[] memory userPrices = new UserPrice[](self.size);
        address current = self.head;
        uint256 index = 0;

        while (current != address(0)) {
            userPrices[index] = UserPrice(current, self.nodes[current].price);
            current = self.nodes[current].next;
            index++;
        }

        return userPrices;
    }
}
