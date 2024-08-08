// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IRSIndex {
    event RSIBonusSet(uint256 RSIndex);

    // _______________ Public functions _______________

    /**
     * @notice Get the rsi
     * @return RSIndex
     * @dev return the rsi
     */
    function getRSIBonus() external view returns (uint256);
}
