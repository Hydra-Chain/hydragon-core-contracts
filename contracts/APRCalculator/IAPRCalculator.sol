// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IAPRCalculator {

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
}
