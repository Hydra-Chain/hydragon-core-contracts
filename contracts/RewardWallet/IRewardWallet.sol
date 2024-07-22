// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IRewardWallet {
    event Received(address indexed from, uint256 amount);
    event RewardDistributed(address indexed account, uint256 amount);

    error DistributionFailed();

    /**
     * @notice Distribute the specified `amount` of coins to the given address.
     * @dev Can only be called by a manager address, e.g., HydraStaking or HydraChain contracts.
     * @param to The address to receive the coins.
     * @param amount The amount of coins to send.
     */
    function distributeReward(address to, uint256 amount) external;
}
