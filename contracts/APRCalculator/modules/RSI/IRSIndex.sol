// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IRSIndex {
    event RSIBonusSet(uint256 RSIndex);

    /**
     * @notice Guard the RSI, so it cannot be changed from price and put it to inital value, or if disabled, it anables it
     * @dev only governance can call this function in case of emergency or price manipulation
     */
    function gardRSIndex() external;

    // _______________ Public functions _______________

    /**
     * @notice Get the rsi
     * @return RSIndex
     * @dev return the rsi
     */
    function getRSIBonus() external view returns (uint256);
}
