// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../common/libs/SafeMathInt.sol";
import {DelegationPool} from "./IDelegation.sol";

error NoTokensDelegated(address staker);

/**
 * @title Delegation Pool Lib
 * @author Rosen Santev (Based Polygon Technology's RewardPoolLib)
 * @notice library for handling delegators and their rewards
 * Each staker has a Delegation Pool. The rewards that a staker receives are split between the staker and the delegators of that staker. The pool holds the delegators' share of the rewards, and maintains an accounting system for determining the delegators' shares in the pool. Rewards, whether to a staker (from stake) or to a delegator, do not autocompound, as to say that if a staker has a stake of 10 and earns 1 in rewards, their stake remains 10, and they have a separate one in rewards.
 */
library DelegationPoolLib {
    using SafeMathUint for uint256;
    using SafeMathInt for int256;

    /**
     * @notice distributes an amount to a pool
     * @param pool the DelegationPool for rewards to be distributed to
     * @param amount the total amount to be distributed
     */
    function distributeReward(DelegationPool storage pool, uint256 amount) internal {
        if (amount == 0) return;
        if (pool.virtualSupply == 0) revert NoTokensDelegated(pool.staker);
        pool.magnifiedRewardPerShare += (amount * magnitude()) / pool.virtualSupply;
    }

    /**
     * @notice credits the balance of a specific pool member
     * @param pool the DelegationPool of the account to credit
     * @param account the address to be credited
     * @param amount the amount to credit the account by
     */
    function deposit(DelegationPool storage pool, address account, uint256 amount) internal {
        uint256 share = (pool.virtualSupply == 0 || pool.supply == 0)
            ? amount
            : (amount * pool.virtualSupply) / pool.supply;
        pool.balances[account] += share;
        pool.virtualSupply += share;
        pool.supply += amount;
        // slither-disable-next-line divide-before-multiply
        pool.magnifiedRewardCorrections[account] -= (pool.magnifiedRewardPerShare * share).toInt256Safe();
    }

    /**
     * @notice decrements the balance of a specific pool member
     * @param pool the DelegationPool of the account to decrement the balance of
     * @param account the address to decrement the balance of
     * @param amount the amount to decrement the balance by
     */
    function withdraw(DelegationPool storage pool, address account, uint256 amount) internal {
        uint256 share = (amount * pool.virtualSupply) / pool.supply;
        pool.balances[account] -= share;
        pool.virtualSupply -= share;
        // slither-disable-next-line divide-before-multiply
        pool.magnifiedRewardCorrections[account] += (pool.magnifiedRewardPerShare * share).toInt256Safe();
        pool.supply -= amount;
    }

    /**
     * @notice increments the amount rewards claimed by an account
     * @param pool the DelegationPool the rewards have been claimed from
     * @param account the address claiming the rewards
     * @return reward the amount of rewards claimed
     */
    function claimRewards(DelegationPool storage pool, address account) internal returns (uint256 reward) {
        reward = claimableRewards(pool, account);
        pool.claimedRewards[account] += reward;
    }

    /**
     * @notice returns the balance (eg amount delegated) of an account in a specific pool
     * @param pool the DelegationPool to query the balance from
     * @param account the address to query the balance of
     * @return uint256 the balance of the account
     */
    function balanceOf(DelegationPool storage pool, address account) internal view returns (uint256) {
        if (pool.virtualSupply == 0) return 0;
        return (pool.balances[account] * pool.supply) / pool.virtualSupply;
    }

    /**
     * @notice returns the correction of rewards for an account in a specific pool
     * @param pool the DelegationPool to query the correction from
     * @param account the address to query the correction of
     * @return int256 the correction of the account
     */
    function correctionOf(DelegationPool storage pool, address account) internal view returns (int256) {
        return pool.magnifiedRewardCorrections[account];
    }

    /**
     * @notice returns the historical total rewards earned by an account in a specific pool
     * @param pool the DelegationPool to query the total from
     * @param account the address to query the balance of
     * @return uint256 the total claimed by the account
     */
    function totalRewardsEarned(DelegationPool storage pool, address account) internal view returns (uint256) {
        int256 magnifiedRewards = (pool.magnifiedRewardPerShare * pool.balances[account]).toInt256Safe();
        uint256 correctedRewards = (magnifiedRewards + pool.magnifiedRewardCorrections[account]).toUint256Safe();
        return correctedRewards / magnitude();
    }

    /**
     * @notice returns the current amount of claimable rewards for an address in a pool
     * @param pool the DelegationPool to query the claimable rewards from
     * @param account the address for which query the amount of claimable rewards
     * @return uint256 the amount of claimable rewards for the address
     */
    function claimableRewards(DelegationPool storage pool, address account) internal view returns (uint256) {
        return totalRewardsEarned(pool, account) - pool.claimedRewards[account];
    }

    /**
     * @notice returns the scaling factor used for decimal places
     * @dev this means the last 18 places in a number are to the right of the decimal point
     * @return uint256 the scaling factor
     */
    function magnitude() private pure returns (uint256) {
        return 1e18;
    }

    /**
     * @notice returns the amount of rewards earned by an account in a pool
     * @param rps the reward per share
     * @param balance the balance of the account
     * @param correction the correction of the account
     * @return uint256 the amount of rewards earned by the account
     */
    function rewardsEarned(uint256 rps, uint256 balance, int256 correction) internal pure returns (uint256) {
        int256 magnifiedRewards = (rps * balance).toInt256Safe();
        uint256 correctedRewards = (magnifiedRewards + correction).toUint256Safe();
        return correctedRewards / magnitude();
    }

    /**
     * @notice returns the amount of claimable rewards for an address in a pool
     * @param pool the DelegationPool to query the claimable rewards from
     * @param account the address for which query the amount of claimable rewards
     * @param rps the reward per share
     * @param balance the balance of the account
     * @param correction the correction of the account
     * @return uint256 the amount of claimable rewards for the address
     */
    function claimableRewards(
        DelegationPool storage pool,
        address account,
        uint256 rps,
        uint256 balance,
        int256 correction
    ) internal view returns (uint256) {
        uint256 _rewardsEarned = rewardsEarned(rps, balance, correction);
        uint256 claimedRewards = pool.claimedRewards[account];
        if (claimedRewards >= _rewardsEarned) return 0;

        return _rewardsEarned - claimedRewards;
    }

    /**
     * @notice claims the rewards for an address in a pool
     * @param pool the DelegationPool to claim the rewards from
     * @param account the address for which to claim the rewards
     * @param rps the reward per share
     * @param balance the balance of the account
     * @param correction the correction of the account
     * @return reward the amount of rewards claimed
     */
    function claimRewards(
        DelegationPool storage pool,
        address account,
        uint256 rps,
        uint256 balance,
        int256 correction
    ) internal returns (uint256 reward) {
        reward = claimableRewards(pool, account, rps, balance, correction);
        pool.claimedRewards[account] += reward;
    }
}
