// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IAccessControl {
    event AddedToWhitelist(address indexed validator);
    event RemovedFromWhitelist(address indexed validator);

    error MustBeWhitelisted();
    error PreviouslyWhitelisted();
    error WhitelistingAlreadyEnabled();
    error WhitelistingAlreadyDisabled();

    /**
     * @notice Enables the whitelisting feature.
     * @dev Only callable by the contract owner.
     */
    function enableWhitelisting() external;

    /**
     * @notice Disables the whitelisting feature.
     * @dev Only callable by the contract owner.
     */
    function disableWhitelisting() external;

    /**
     * @notice Adds addresses that are allowed to register as validators.
     * @param whitelistAddreses Array of address to whitelist
     */
    function addToWhitelist(address[] calldata whitelistAddreses) external;

    /**
     * @notice Deletes addresses that are allowed to register as validators.
     * @param whitelistAddreses Array of address to remove from whitelist
     */
    function removeFromWhitelist(address[] calldata whitelistAddreses) external;
}
