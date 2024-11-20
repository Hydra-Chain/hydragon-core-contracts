// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct VestingPosition {
    uint256 duration;
    uint256 start;
    uint256 end;
    uint256 base;
    uint256 vestBonus;
    uint256 rsiBonus;
    uint256 commission;
}

interface IVesting {
    error FailedToBurnAmount();
    error PenaltyRateOutOfRange();

    /**
     * @notice sets a new penalty rate
     * @param newRate the new penalty rate
     * @dev Only callable by the admin
     * @dev the rate should be between 10 and 150 (0.1% and 1.5%)
     */
    function setPenaltyDecreasePerWeek(uint256 newRate) external;
}
