// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IDaoIncentive {
    event VaultFundsDistributed(uint256 amount);
    event VaultFunded(uint256 amount);

    /**
     * @notice Distribute vault funds
     * @dev Only callable by the system
     */
    function distributeDAOIncentive() external;

    /**
     * @notice Claim distributed vault funds
     */
    function claimVaultFunds() external;
}
