// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @title StateSync
 * @notice This contract is used to emit a specific event when balance state changes;
 */
abstract contract StateSync {
    event BalanceChanged(address indexed account, uint256 newBalance);

    /**
     * @notice Emit a BalanceChanged event
     * @param account The address of the account
     */
    function _syncState(address account) internal {
        emit BalanceChanged(account, StateSync_getBalance(account));
    }

    /**
     * @dev override to set how the balance must be fetched
     */
    function StateSync_getBalance(address account) internal virtual returns (uint256);

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
