// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IPrice} from "./modules/Price/IPrice.sol";
import {IRSIndex} from "./modules/RSI/IRSIndex.sol";
import {IMacroFactor} from "./modules/MacroFactor/IMacroFactor.sol";

interface IAPRCalculator is IMacroFactor, IRSIndex, IPrice {
    error InvalidRSI();

    // _______________ Public functions _______________

    /**
     * @notice Returns base APR
     */
    function getBaseAPR() external view returns (uint256);

    /**
     * @notice Returns the denominator for the APR calculation
     */
    function getDENOMINATOR() external pure returns (uint256);

    /**
     * @notice Applies the base APR for the given amount
     * @param amount the amount to apply the APR to
     */
    function applyBaseAPR(uint256 amount) external view returns (uint256);

    /**
     * @notice Applies macro factor for the given total staked amount
     * @param totalStaked the total staked amount to apply the macro factor to
     */
    function applyMacro(uint256 totalStaked) external view returns (uint256 reward);

    /**
     * @notice Returns the vesting bonus for the given weeks count
     * @param weeksCount the amount of weeks to calculate the bonus for
     */
    function getVestingBonus(uint256 weeksCount) external view returns (uint256 nominator);

    /**
     * @notice Returns the max APR for 52 weeks
     * @return nominator the nominator for the max APR
     * @return denominator the denominator for the max APR
     */
    function getMaxAPR() external view returns (uint256 nominator, uint256 denominator);

    /**
     * @notice Returns the max yearly reward for the given total staked amount
     * @param totalStaked the total staked amount to apply the max APR params to
     */
    function getMaxYearlyReward(uint256 totalStaked) external view returns (uint256 reward);
}
