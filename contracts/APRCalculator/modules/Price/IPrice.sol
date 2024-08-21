// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IPrice {
    event PriceUpdated(uint256 day, uint256 price);

    error GuardAlreadyDisabled();
    error GuardAlreadyEnabled();
    error PriceAlreadySet();
    error InvalidDay();

    /**
     * @notice Updates the price for the last day
     * @dev only the PriceOracle can call this function
     * @param price the price to be updated
     * @param day the day to be updated
     */
    function updatePrice(uint256 price, uint256 day) external;

    /**
     * @notice Protects RSI bonus and Macro factor updates and set them to default values
     * @dev only governance can call this function
     */
    function guardBonuses() external;

    /**
     * @notice Enables the RSI bonus and Macro factor updates again
     * @dev only governance can call this function
     */
    function disableGuard() external;
}
