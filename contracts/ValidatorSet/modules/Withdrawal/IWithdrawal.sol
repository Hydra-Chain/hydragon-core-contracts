// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IWithdrawal {
    event WithdrawalRegistered(address indexed account, uint256 amount);
    event WithdrawalFinished(address indexed account, address indexed to, uint256 amount);

    /**
     * @notice Withdraws sender's withdrawable amount to specified address.
     * @param to Address to withdraw to
     */
    function withdraw(address to) external;

    /**
     * @notice Calculates how much can be withdrawn for account in this time.
     * @param account The account to calculate amount for
     * @return Amount withdrawable (in wei)
     */
    function withdrawable(address account) external view returns (uint256);

    /**
     * @notice Calculates how much is yet to become withdrawable for account.
     * @param account The account to calculate amount for
     * @return Amount not yet withdrawable (in wei)
     */
    function pendingWithdrawals(address account) external view returns (uint256);

    /**
     * @notice Changes the withdrawal wait period.
     * @dev This function should be called only by the Governed contract.
     * @param newWaitPeriod The new withdrawal wait period
     */
    function changeWithdrawalWaitPeriod(uint256 newWaitPeriod) external;
}
