// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IVestedDelegation {
    event PositionOpened(
        address indexed manager,
        address indexed validator,
        uint256 indexed weeksDuration,
        uint256 amount
    );
    event PositionCut(address indexed manager, address indexed validator, uint256 amount);
    event PositionSwapped(address indexed manager, address indexed oldValidator, address newValidator, uint256 amount);

    /// @notice Gets the vesting managers per user address for fast off-chain lookup.
    function getUserVestManagers(address user) external view returns (address[] memory);

    /**
     * @notice Creates new vesting manager which owner is the caller.
     * Every new instance is proxy leading to base impl, so minimal fees are applied.
     * Only Vesting manager can use the vesting functionality,
     * so users need to create a manager first to be able to vest.
     */
    function newManager(address rewardPool) external;
}
