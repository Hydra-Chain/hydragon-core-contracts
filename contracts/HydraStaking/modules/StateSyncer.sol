// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @title StateSyncer
 * @notice This contract is used to emit a specific event on stake, unstake, delegate and undelegate;
 * Child chain listen for this event to sync the state of the validators
 */
abstract contract StateSyncer {
    event StakeChanged(address indexed validator, uint256 newStake);

    /**
     * @notice Emit a StakeChanged event on stake
     * @param staker The address of the staker
     * @param totalBalance New total balance (stake + delegated)
     * @dev Use on delegate as well
     */
    function _syncStake(address staker, uint256 totalBalance) internal {
        emit StakeChanged(staker, totalBalance);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
