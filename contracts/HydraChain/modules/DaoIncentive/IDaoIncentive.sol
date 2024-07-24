// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IDaoIncentive {
    event VaultFundsDistributed(uint256 indexed epoch, uint256 amount);
    event VaultFunded(uint256 indexed epoch, uint256 amount);

    /**
     * @notice Get current epoch ID
     */
    function getCurrentEpochId() external view returns (uint256);

    /**
     * @notice Distribute vault funds
     * @dev Only callable by the system
     */
    function distributeVaultFunds() external;

    /**
     * @notice Claim distributed vault funds
     */
    function claimVaultFunds() external;
}
