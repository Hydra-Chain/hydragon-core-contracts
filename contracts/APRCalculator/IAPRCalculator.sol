// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IAPRCalculator {
    function getBaseAPR() external view returns (uint256);

    function getRSIBonus() external view returns (uint256);

    function getDENOMINATOR() external pure returns (uint256);

    function getEpochsPerYear() external pure returns (uint256);

    function applyBaseAPR(uint256 amount) external view returns (uint256);

    function applyMaxReward(uint256 reward) external view returns (uint256);

    function calcVestingBonus(uint256 weeksCount) external view returns (uint256);

    function applyMacro(uint256 totalStaked) external view returns (uint256 reward);

    function getVestingBonus(uint256 weeksCount) external view returns (uint256 nominator);
}
