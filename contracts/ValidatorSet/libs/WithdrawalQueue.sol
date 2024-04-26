// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./IWithdrawalQueue.sol";

/**
 * @title Withdrawal Queue Lib
 * @author Polygon Technology (Daniel Gretzke @gretzke)
 * @notice queue for withdrawals
 * Unstaking, undelegating, and rewards withdrawal have delays associated with them. The Withdrawal Queue library exists to manage withdrawals. Each address has their own separate queue to manage their individual withdrawals.
 */
library WithdrawalQueueLib {
    /**
     * @notice update queue with new withdrawal data
     * @dev every time a new struct will be sumbited for withdrawal in the queue
     * @param self the WithdrawalQueue struct
     * @param amount the amount to withdraw
     * @param withdrawableTime the time at which the withdrawal can be processed
     */
    function append(WithdrawalQueue storage self, uint256 amount, uint256 withdrawableTime) internal {
        assert(amount != 0);
        assert(withdrawableTime > block.timestamp);
        uint256 head = self.head;
        uint256 tail = self.tail;

        // first element in empty list
        if (tail == head) {
            self.withdrawals[tail] = WithdrawalData(amount, withdrawableTime);
            self.tail++;
            return;
        }

        self.withdrawals[tail] = WithdrawalData(amount, withdrawableTime);
        self.tail++;
    }

    /**
     * @notice returns the length between the head and tail of the queue
     * (which is the amount of unprocessed withdrawals)
     * @param self the WithdrawalQueue struct
     * @return uint256 the length between head and tail (unproceesed withdrawals)
     */
    // slither-disable-next-line dead-code
    function length(WithdrawalQueue storage self) internal view returns (uint256) {
        return self.tail - self.head;
    }

    /**
     * @notice returns the amount withdrawable through a specified time
     * and new head index at that point
     * @dev meant to be used with the current timestamp
     * @param self the WithdrawalQueue struct
     * @return amount the amount withdrawable through the specified time
     * @return newHead the head of the queue once these withdrawals have been processed
     */
    function withdrawable(
        WithdrawalQueue storage self
    ) internal view returns (uint256 amount, uint256 newHead) {
        uint256 currentTimestamp = block.timestamp;
        for (newHead = self.head; newHead < self.tail; newHead++) {
            WithdrawalData memory withdrawal = self.withdrawals[newHead];
            if (withdrawal.time > currentTimestamp) return (amount, newHead);
            amount += withdrawal.amount;
        }
    }

    /**
     * @notice returns the amount withdrawable beyond a specified time
     * @dev meant to be used with the current timestamp
     * @param self the WithdrawalQueue struct
     * @return amount the amount withdrawable from beyond the specified time
     */
    function pending(WithdrawalQueue storage self) internal view returns (uint256 amount) {
        uint256 tail = self.tail;
        if (tail == 0) return 0;
        uint256 currentTimestamp = block.timestamp;
        for (uint256 i = tail - 1; i >= self.head; i--) {
            WithdrawalData memory withdrawal = self.withdrawals[i];
            if (withdrawal.time <= currentTimestamp) break;
            amount += withdrawal.amount;
            if (i == 0) break;
        }
    }
}
