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
