// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMacroFactor {
    event MacroFactorSet(uint256 macroFactor);
    event DefaultMacroFactorChanged(uint256 macroFactor);

    error InvalidMacroFactor();

    /**
     * @notice Change the default macro factor
     * @param _macroFactor The new default macro factor
     * @dev only governance can call this function
     */
    function changeDefaultMacroFactor(uint256 _macroFactor) external;

    // _______________ Public functions _______________

    /**
     * @notice Get the macro factor
     * @return macro factor
     * @dev return the macro factor
     */
    function getMacroFactor() external view returns (uint256);
}

