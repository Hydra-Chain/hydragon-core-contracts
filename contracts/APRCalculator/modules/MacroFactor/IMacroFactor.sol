// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMacroFactor {
    event MacroFactorSet(uint256 macroFactor);

    /**
     * @notice Guard the macro factor, so it cannot be changed from price and put it to inital value, or if disabled, it anables it
     * @dev only governance can call this function in case of emergency or price manipulation
     */
    function gardMacroFactor() external;

    // _______________ Public functions _______________

    /**
     * @notice Get the macro factor
     * @return macro factor
     * @dev return the macro factor
     */
    function getMacroFactor() external view returns (uint256);
}
