// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IWithdrawal} from "./../common/Withdrawal/IWithdrawal.sol";

struct StakingReward {
    uint256 taken;
    uint256 total;
}

interface IStaking is IWithdrawal {
    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event StakingRewardsClaimed(address indexed account, uint256 amount);
    event StakingRewardDistributed(address indexed account, uint256 amount);

    error NoRewards();
    error InvalidMinStake();
    error StakeRequirement(string src, string msg);

    /**
     * @notice Stakes sent amount.
     */
    function stake() external payable;

    /**
     * @notice Unstakes amount for sender. Claims rewards beforehand.
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external;

    /**
     * @dev Should be called by the Governance.
     * @notice Changes minimum stake required for validators.
     * @param newMinStake New minimum stake
     */
    function changeMinStake(uint256 newMinStake) external;
}
