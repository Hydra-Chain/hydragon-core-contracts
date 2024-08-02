// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IPrice} from "./modules/Price/IPrice.sol";
import {IMacroFactor} from "./modules/MacroFactor/IMacroFactor.sol";

interface IAPRCalculator is IMacroFactor, IPrice {
    error InvalidRSI();

    /**
     * @notice sets new base APR
     * @dev only owner can call this function
     * @param newBase new base APR
     */
    function setBase(uint256 newBase) external;

    /**
     * @notice sets new RSI value
     * @dev only owner can call this function
     * @param newRSI new RSI value
     */
    function setRSI(uint256 newRSI) external;

    // _______________ Public functions _______________

    /**
     * @notice returns base APR
     */
    function getBaseAPR() external view returns (uint256);

    /**
     * @notice returns max reward
     */
    function getRSIBonus() external view returns (uint256);

    /**
     * @notice returns the denominator for the APR calculation
     */
    function getDENOMINATOR() external pure returns (uint256);

    /**
     * @notice returns the number of epochs per year
     */
    function getEpochsPerYear() external pure returns (uint256);

    /**
     * @notice applies the base APR for the given amount
     * @param amount the amount to apply the APR to
     */
    function applyBaseAPR(uint256 amount) external view returns (uint256);

    /**
     * @notice applies the max reward for the given amount - 52 weeks
     * @param reward the reward to apply the max reward to
     */
    function applyMaxReward(uint256 reward) external view returns (uint256);

    /**
     * @notice applies macro factor for the given total staked amount
     * @param totalStaked the total staked amount to apply the macro factor to
     */
    function applyMacro(uint256 totalStaked) external view returns (uint256 reward);

    /**
     * @notice returns the vesting bonus for the given weeks count
     * @param weeksCount the amount of weeks to calculate the bonus for
     */
    function getVestingBonus(uint256 weeksCount) external view returns (uint256 nominator);

    /**
     * @notice returns the max APR for 52 weeks
     * @return nominator the nominator for the max APR
     * @return denominator the denominator for the max APR
     */
    function getMaxAPR() external view returns (uint256 nominator, uint256 denominator);

    /**
     * @notice returns the epoch max reward for the given total staked amount
     * @param totalStaked the total staked amount to apply the max epoch reward to
     */
    function getEpochMaxReward(uint256 totalStaked) external view returns (uint256 reward);
}
