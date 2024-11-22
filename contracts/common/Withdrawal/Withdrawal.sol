// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {Governed} from "../Governed/Governed.sol";
import {WithdrawalQueueLib, WithdrawalQueue} from "./WithdrawalQueueLib.sol";
import {IWithdrawal} from "./IWithdrawal.sol";

abstract contract Withdrawal is IWithdrawal, ReentrancyGuardUpgradeable, Governed {
    using WithdrawalQueueLib for WithdrawalQueue;

    uint256 public withdrawWaitPeriod;

    mapping(address => WithdrawalQueue) private _withdrawals;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Withdrawal_init() internal {
        __ReentrancyGuard_init();
        __Withdrawal_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Withdrawal_init_unchained() internal onlyInitializing {
        _changeWithdrawalWaitPeriod(1 weeks);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IWithdrawal
     */
    function withdraw(address to) external nonReentrant {
        WithdrawalQueue storage queue = _withdrawals[msg.sender];
        (uint256 amount, uint256 newHead) = queue.withdrawable();
        if (amount == 0) revert NoWithdrawalAvailable();
        queue.head = newHead;

        _withdraw(to, amount);
    }

    /**
     * @inheritdoc IWithdrawal
     */
    function changeWithdrawalWaitPeriod(uint256 newWaitPeriod) external onlyGovernance {
        _changeWithdrawalWaitPeriod(newWaitPeriod);
    }

    /**
     * @inheritdoc IWithdrawal
     */
    function withdrawable(address account) external view returns (uint256 amount) {
        (amount, ) = _withdrawals[account].withdrawable();
    }

    /**
     * @inheritdoc IWithdrawal
     */
    function pendingWithdrawals(address account) external view returns (uint256) {
        return _withdrawals[account].pending();
    }

    // _______________ Internal functions _______________

    function _registerWithdrawal(address account, uint256 amount) internal {
        _withdrawals[account].append(amount, block.timestamp + withdrawWaitPeriod);
        emit WithdrawalRegistered(account, amount);
    }

    function _withdraw(address to, uint256 amount) internal {
        // slither-disable-next-line arbitrary-send-eth
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert WithdrawalFailed();

        emit WithdrawalFinished(address(this), to, amount);
    }

    // _______________ Private functions _______________

    function _changeWithdrawalWaitPeriod(uint256 _newWaitPeriod) private {
        if (_newWaitPeriod == 0) revert InvalidWaitPeriod();
        withdrawWaitPeriod = _newWaitPeriod;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
