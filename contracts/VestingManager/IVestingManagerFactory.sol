// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IVestingManagerFactory {
    event NewVestingManager(address indexed owner, address newClone);

    error InvalidOwner();

    /**
     * @notice Creates new vesting manager which owner is the caller.
     * Every new instance is proxy leading to base impl, so minimal fees are applied.
     * Only Vesting manager can use the vesting functionality,
     * So users need to create a manager first to be able to vest.
     */
    function newVestingManager() external;

    /**
     * @notice Claims that a delegator is a vest manager or not.
     * @param account Delegator's address
     */
    function isVestingManager(address account) external view returns (bool);

    /**
     * @notice Gets user vesting managers.
     * @dev Gets the vesting managers per user address for fast off-chain lookup.
     * @param user User address
     */
    function getUserVestingManagers(address user) external view returns (address[] memory);
}
