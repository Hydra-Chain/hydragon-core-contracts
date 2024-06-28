// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @notice data type representing Voting Power Exponent Numerator (Denominator is 10000)
 * @param value current value used by clients to calculate Voting Power
 * @param pendingValue new value that would be activated in the next commit epoch
 */
struct PowerExponentStore {
    uint128 value;
    uint128 pendingValue;
}

/**
 * @title PowerExponent
 * @author H_MODIFY
 * @notice Storing Voting Power Exponent Numerator (Denominator is 10000). Client use it to calculate voting power.
 * @dev Voting Power = staked balance ^ (numerator / denominator)
 */
interface IPowerExponent {
    /**
     * @notice Set new pending exponent, to be activated in the next commit epoch
     * @param newValue New Voting Power Exponent Numerator
     */
    function updateExponent(uint256 newValue) external;

    /**
     * @notice Return the Voting Power Exponent Numerator and Denominator
     * @return numerator Voting Power Exponent Numerator
     * @return denominator Voting Power Exponent Denominator
     */
    function getExponent() external view returns (uint256 numerator, uint256 denominator);
}
