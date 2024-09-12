// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @notice Data type for a node in the list
 * @param price The price voted by the validator
 * @param next The next validator in the list
 */
struct Node {
    uint256 price;
    address next;
}

/**
 * @notice Data type for a sorted list
 * @param nodes Mapping of validator address to Node
 * @param head The head of the list
 */
struct List {
    mapping(address => Node) nodes;
    address head;
    uint256 size;
}

/**
 * @notice Data type for a validator price
 * @param validator The validator address
 * @param price The price voted by the validator
 */
struct ValidatorPrice {
    address validator;
    uint256 price;
}
