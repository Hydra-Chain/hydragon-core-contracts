// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

library SafeMathInt {
    /**
     * @notice Converts an int256 to uint256
     * @param a int256 to convert
     * @return uint256 of the input
     */
    function toUint256Safe(int256 a) internal pure returns (uint256) {
        assert(a >= 0);
        return uint256(a);
    }
}
