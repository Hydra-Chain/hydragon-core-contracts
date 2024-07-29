// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMacroFactor {
    event MacroFactorSet(uint256 macroFactor); 
    
    /**
     * @notice Set the macro factor
     * @dev only system can call this function
     */
    function setMacroFactor() external;

    // _______________ Public functions _______________

    /**
     * @notice Get the macro factor
     * @return macro factor
     * @dev return the macro factor
     */
    function getMacroFactor() external view returns (uint256);
}
