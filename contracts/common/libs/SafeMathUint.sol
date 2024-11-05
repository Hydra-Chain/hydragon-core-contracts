// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

library SafeMathUint {
    /**
     * @notice Converts a uint256 to int256
     * @param a the uint256 to convert
     * @return int256 of the input
     */
    function toInt256Safe(uint256 a) internal pure returns (int256) {
        int256 b = int256(a);
        assert(b >= 0);
        return b;
    }
}
