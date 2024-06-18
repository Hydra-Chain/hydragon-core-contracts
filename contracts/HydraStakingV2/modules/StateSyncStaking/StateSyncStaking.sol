// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";

/**
 * @title StateSyncStaking
 * @notice This contract is used to emit a specific event when staked balance changes;
 * Child chain listen for this event to sync the state of the validators
 */
abstract contract StateSyncStaking is Staking {
    event BalanceChanged(address indexed account, uint256 newBalance);

    function _stake(address account, uint256 amount) internal virtual override {
        super._stake(account, amount);
        _syncState(account);
    }

    function _unstake(
        address account,
        uint256 amount
    ) internal virtual override returns (uint256 stakeLeft, uint256 withdrawAmount) {
        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        _syncState(account);
    }

    /**
     * @notice Emit a BalanceChanged event
     * @param account The address of the account
     */
    function _syncState(address account) internal {
        emit BalanceChanged(account, _getBalanceToSync(account));
    }

    /**
     * @dev override to set how the balance must be fetched
     */
    function _getBalanceToSync(address account) internal virtual returns (uint256);

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
