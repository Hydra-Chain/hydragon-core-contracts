// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @notice Data type for withdrawals
 * @param amount the amount to withdraw
 * @param time the timestamp of the withdrawal
 */
struct WithdrawalData {
    uint256 amount;
    uint256 time;
}

/**
 * @notice Data type for managing the withdrawal queue
 * @param head earliest unprocessed index
 * (which is also the most recently filled witrhdrawal)
 * @param tail index of most recent withdrawal
 * (which is also the total number of submitted withdrawals)
 * @param withdrawals Withdrawal structs by index
 */
struct WithdrawalQueue {
    uint256 head;
    uint256 tail;
    mapping(uint256 => WithdrawalData) withdrawals;
}
