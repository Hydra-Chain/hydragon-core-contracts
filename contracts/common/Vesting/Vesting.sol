// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {APRCalculatorConnector} from "../../APRCalculator/APRCalculatorConnector.sol";
import {VestedPositionLib} from "./VestedPositionLib.sol";
import {VestingPosition} from "./IVesting.sol";

/**
 * @title VestedStaking
 * @notice An extension of the Staking contract that enables vesting the stake for a higher APY
 */
abstract contract Vesting is APRCalculatorConnector {
    using VestedPositionLib for VestingPosition;

    error FailedToBurnAmount();

    /**
     * @notice A constant for the calculation of the weeks left of a vesting period
     * @dev Representing a week in seconds - 1
     */
    uint256 private constant WEEK_MINUS_SECOND = 604799;

    // _______________ Internal functions _______________

    /**
     * @notice Method used to burn funds
     * @param amount The amount to be burned
     */
    function _burnAmount(uint256 amount) internal {
        (bool success, ) = address(0).call{value: amount}("");
        if (!success) {
            revert FailedToBurnAmount();
        }
    }

    /**
     * @notice Calculates what part of the provided amount of tokens to be slashed
     * @dev Invoke only when position is active, otherwise - underflow
     * @param position The vesting position of the staker
     * @param amount Amount of tokens to be slashed
     * @return The amount of tokens to be slashed
     */
    function _calcPenalty(VestingPosition memory position, uint256 amount) internal view returns (uint256) {
        uint256 leftPeriod = position.end - block.timestamp;
        uint256 leftWeeks = (leftPeriod + WEEK_MINUS_SECOND) / 1 weeks;
        uint256 bps = 100 * leftWeeks; // 1% * left weeks

        return (amount * bps) / aprCalculatorContract.getDENOMINATOR();
    }

    /**
     * @notice Function that applies the custom factors - base APR, vest bonus and rsi bonus
     * @dev Denominator is used because we should work with floating-point numbers
     * @param position The vesting position of the staker
     * @param reward index The reward to which we gonna apply the custom APR
     * @return The reward with the applied APR
     */
    function _applyVestingAPR(VestingPosition memory position, uint256 reward) internal view returns (uint256) {
        uint256 bonus = (position.base + position.vestBonus);
        uint256 divider = aprCalculatorContract.getDENOMINATOR();
        if (position.rsiBonus != 0) {
            bonus *= position.rsiBonus;
            divider *= divider;
        }

        return (reward * bonus) / divider;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
