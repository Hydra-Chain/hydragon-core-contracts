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
    uint256 public WITHDRAWAL_WAIT_PERIOD = 7 days;
    mapping(address => WithdrawalQueue) private _withdrawals;

    /**
     * @inheritdoc IWithdrawal
     */
    function withdraw(address to) external nonReentrant {
        assert(to != address(0));
        WithdrawalQueue storage queue = _withdrawals[msg.sender];
        (uint256 amount, uint256 newHead) = queue.withdrawable();
        require(amount > 0, "NO_WITHDRAWAL_AVAILABLE");
        queue.head = newHead;

        emit WithdrawalFinished(msg.sender, to, amount);

        // slither-disable-next-line low-level-calls
        (bool success, ) = to.call{value: amount}(""); // solhint-disable-line avoid-low-level-calls
        require(success, "WITHDRAWAL_FAILED");
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
        require(newWaitPeriod > 0, "INVALID_WAIT_PERIOD");
        WITHDRAWAL_WAIT_PERIOD = newWaitPeriod;
    }

    function _registerWithdrawal(address account, uint256 amount) internal {
        _withdrawals[account].append(amount, block.timestamp + WITHDRAWAL_WAIT_PERIOD);
        emit WithdrawalRegistered(account, amount);
    }

}
