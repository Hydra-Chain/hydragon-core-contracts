// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./IWithdrawal.sol";
import "./../AccessControl/AccessControl.sol";
import "./../../ValidatorSetBase.sol";
import "./../../libs/WithdrawalQueue.sol";

abstract contract Withdrawal is IWithdrawal, ReentrancyGuardUpgradeable, ValidatorSetBase, AccessControl {
    using WithdrawalQueueLib for WithdrawalQueue;

    // TODO: This should be a parameter of the contract. Add NetworkParams based on the Polygon implementation
    uint256 public withdrawWaitPeriod;
    mapping(address => WithdrawalQueue) private _withdrawals;


    // _______________ Initializer _______________

    function __Withdrawal_init(address governance) internal onlyInitializing {
        __Withdrawal_init_unchained();
        __ReentrancyGuard_init();
        __AccessControl_init(governance);
    }

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
    function withdrawable(address account) external view returns (uint256 amount) {
        (amount, ) = _withdrawals[account].withdrawable();
    }

    /**
     * @inheritdoc IWithdrawal
     */
    function pendingWithdrawals(address account) external view returns (uint256) {
        return _withdrawals[account].pending();
    }

    /**
     * @inheritdoc IWithdrawal
     */
    function changeWithdrawalWaitPeriod(uint256 newWaitPeriod) external onlyOwner {
        _changeWithdrawalWaitPeriod(newWaitPeriod);
    }

    function _registerWithdrawal(address account, uint256 amount) internal {
        _withdrawals[account].append(amount, block.timestamp + withdrawWaitPeriod);
        emit WithdrawalRegistered(account, amount);
    }

    // _______________ Internal functions _______________

    function _withdraw(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        require(success, "WITHDRAWAL_FAILED");

        emit WithdrawalFinished(address(this), to, amount);
    }

    // _______________ Private functions _______________

    function _changeWithdrawalWaitPeriod(uint256 _newWaitPeriod) private {
        if (_newWaitPeriod == 0) revert InvalidWaitPeriod();
        withdrawWaitPeriod = _newWaitPeriod;
    } 
}
