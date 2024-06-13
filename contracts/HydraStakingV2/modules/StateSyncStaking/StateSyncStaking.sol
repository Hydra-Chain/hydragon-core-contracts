// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";

/**
 * @title StateSyncStaking
 * @notice This contract is used to emit a specific event when staked balance changes;
 * Child chain listen for this event to sync the state of the validators
 */
contract StateSyncStaking is Staking {
    event StakeChanged(address indexed validator, uint256 newStake);

    function _stake(address account, uint256 amount) internal override {
        super._stake(account, amount);
        _syncStake(account, stakeOf(account));
    }

    function _unstake(
        address account,
        uint256 amount
    ) internal override returns (uint256 stakeLeft, uint256 withdrawAmount) {
        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        _syncStake(account, stakeOf(account));
    }

    /**
     * @notice Emit a StakeChanged event on stake
     * @param staker The address of the staker
     * @param stakeBalance New stake amount
     */
    function _syncStake(address staker, uint256 stakeBalance) internal {
        emit StakeChanged(staker, stakeBalance);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
