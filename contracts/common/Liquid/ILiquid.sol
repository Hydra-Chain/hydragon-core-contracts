// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ILiquid {
    /**
     * @notice Returns the address of the token that is distributed as a liquidity on stake
     */
    function liquidToken() external view returns (address);

    /**
     * @notice Returns the amount of liquid tokens the user owes to the protocol based on the given amount
     * @param account The address of the account
     * @param amount The amount to be checked
     * @return The amount of liquid tokens the user owes to the protocol
     */
    function calculateOwedLiquidTokens(address account, uint256 amount) external view returns (uint256);
}
