// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IPrice} from "../Price/IPrice.sol";

interface IRSIndex is IPrice {
    event RSIBonusSet(uint256 rsiBonus);

    // _______________ Public functions _______________

    /**
     * @notice Get the rsi
     * @return RSIndex
     * @dev return the rsi
     */
    function getRSIBonus() external view returns (uint256);
}
