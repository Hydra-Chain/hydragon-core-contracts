// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "../../common/Governed/Governed.sol";
import {APRCalculatorConnector} from "../../APRCalculator/APRCalculatorConnector.sol";
import {VestedPositionLib} from "./VestedPositionLib.sol";
import {VestingPosition, IVesting} from "./IVesting.sol";

/**
 * @title VestedStaking
 * @notice An extension of the Staking contract that enables vesting the stake for a higher APY
 */
abstract contract Vesting is IVesting, Governed, APRCalculatorConnector {
    using VestedPositionLib for VestingPosition;

    uint256 public constant DENOMINATOR = 10000;
    /**
     * @notice A constant for the calculation of the weeks left of a vesting period
     * @dev Representing a week in seconds - 1
     */
    uint256 private constant WEEK_MINUS_SECOND = 604799;

    /// A fraction's numerator representing the rate
    /// at which the liquidity tokens' distribution is decreased on a weekly basis
    uint256 public vestingLiquidityDecreasePerWeek;
    /// The penalty decrease per week
    uint256 public penaltyDecreasePerWeek;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Vesting_init() internal onlyInitializing {
        __Vesting_init_unchainded();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Vesting_init_unchainded() internal onlyInitializing {
        vestingLiquidityDecreasePerWeek = 133; // 0.0133
        penaltyDecreasePerWeek = 50; // 0.5%
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IVesting
     */
    function setPenaltyDecreasePerWeek(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRate < 10 || newRate > 150) revert PenaltyRateOutOfRange();
        penaltyDecreasePerWeek = newRate;
    }

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
        uint256 bps = penaltyDecreasePerWeek * leftWeeks; // 0.5% per week after initilization

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

    /**
     * @notice Function that calculates the debt vesting position
     * @param amount The amount of tokens for the position
     * @param duration The duration of the vesting position
     * @return debt The debt of the vesting position
     */
    function _calculatePositionDebt(uint256 amount, uint256 duration) internal view returns (uint256 debt) {
        uint256 positionDurationInWeeks = duration / 1 weeks;
        debt = (amount * positionDurationInWeeks * vestingLiquidityDecreasePerWeek) / DENOMINATOR;
    }

    /**
     * Returns whether if we have just opened a vesting position
     * @param position The vesting position of the account
     */
    function _isOpeningPosition(VestingPosition memory position) internal view returns (bool) {
        return position.start == block.timestamp && position.startBlock == block.number;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
