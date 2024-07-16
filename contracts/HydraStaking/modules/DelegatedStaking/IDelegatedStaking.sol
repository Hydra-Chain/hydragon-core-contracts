// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IDelegatedStaking {

    /**
     * @notice Called by the delegation contract when a user delegates to a staker
     * @dev This function should be called by the delegation contract
     * @dev This function also checks if the validator is active
     * @param staker The address of the staker
     */
    function onDelegate(address staker) external;

    /**
     * @notice Called by the delegation contract when a user undelegates from a staker
     * @dev This function should be called by the delegation contract
     * @param staker The address of the staker
     */
    function onUndelegate(address staker) external;
}
