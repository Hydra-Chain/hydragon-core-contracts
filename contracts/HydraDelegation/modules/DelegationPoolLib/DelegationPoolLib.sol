// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../../../common/libs/SafeMathInt.sol";
import {DelegateRequirement} from "./../../../common/Errors.sol";
import {DelegationPool, RPS, DelegationPoolDelegatorParams} from "./IDelegationPoolLib.sol";

/**
 * @title Delegation Pool Library
 * @author Rosen Santev (Based on Polygon Technology's RewardPoolLib)
 * @notice This library is used for managing delegators and their rewards within a staking pool. Each staker has a
 * Delegation Pool that tracks delegators' shares of the staker's rewards.
 * This version supports reward claims based on previous balance states, thanks to the historical
 * `delegatorsParamsHistory` tracking.
 * Rewards do not autocompound. If a staker has a stake of 10 and earns 1 reward, their stake remains 10,
 * with the rewards tracked separately.
 */
library DelegationPoolLib {
    using SafeMathUint for uint256;
    using SafeMathInt for int256;

    /**
     * @notice distributes an amount to a pool
     * @param pool the DelegationPool for rewards to be distributed to
     * @param amount the total amount to be distributed
     * @param epochId The epoch number for which the reward is distributed
     */
    function distributeReward(DelegationPool storage pool, uint256 amount, uint256 epochId) internal {
        if (amount == 0 || pool.virtualSupply == 0) return;
        pool.magnifiedRewardPerShare += (amount * magnitude()) / pool.virtualSupply;

        // Keep history record of the rewardPerShare to be used on reward claim
        _saveEpochRPS(pool, pool.magnifiedRewardPerShare, epochId);
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

    function deposit(DelegationPool storage pool, address account, uint256 amount, uint256 epochId) internal {
        deposit(pool, account, amount);
        // Update delegator params history
        _saveAccountParamsChange(pool, account, epochId);
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
     * @notice decrements the balance of a specific pool member
     * @param pool the DelegationPool of the account to decrement the balance of
     * @param account the address to decrement the balance of
     * @param amount the amount to decrement the balance by
     */
    function withdraw(DelegationPool storage pool, address account, uint256 amount, uint256 epochNumber) internal {
        withdraw(pool, account, amount);
        // Update delegator params history
        _saveAccountParamsChange(pool, account, epochNumber);
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

    function getRPSValues(
        DelegationPool storage pool,
        uint256 startEpoch,
        uint256 endEpoch
    ) internal view returns (RPS[] memory) {
        require(startEpoch <= endEpoch, "Invalid args");

        RPS[] memory values = new RPS[](endEpoch - startEpoch + 1);
        uint256 itemIndex = 0;
        for (uint256 i = startEpoch; i <= endEpoch; i++) {
            if (pool.historyRPS[i].value != 0) {
                values[itemIndex] = (pool.historyRPS[i]);
            }

            itemIndex++;
        }

        return values;
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
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to redelegate the claimed rewards
     * @return uint256 the amount of claimable rewards for the address
     */
    function claimableRewards(
        DelegationPool storage pool,
        address account,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) internal view returns (uint256) {
        // fetch the proper vesting reward params
        (uint256 rps, uint256 balance, int256 correction) = _getRewardParams(
            pool,
            account,
            epochNumber,
            balanceChangeIndex
        );

        uint256 _rewardsEarned = rewardsEarned(rps, balance, correction);
        uint256 claimedRewards = pool.claimedRewards[account];
        if (claimedRewards >= _rewardsEarned) return 0;

        return _rewardsEarned - claimedRewards;
    }

    /**
     * @notice claims the rewards for an address in a pool
     * @param pool the DelegationPool to claim the rewards from
     * @param account the address for which to claim the rewards
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to redelegate the claimed rewards
     * @return reward the amount of rewards claimed
     */
    function claimRewards(
        DelegationPool storage pool,
        address account,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) internal returns (uint256 reward) {
        reward = claimableRewards(pool, account, epochNumber, balanceChangeIndex);
        pool.claimedRewards[account] += reward;
    }

    /**
     * @notice Deletes  the historical data of a delegator
     * @param pool the DelegationPool to clean the historical data from
     * @param account the address of the  delegator to clean the historical data from
     */
    function cleanDelegatorHistoricalData(DelegationPool storage pool, address account) internal {
        delete pool.delegatorsParamsHistory[account];
    }

    /**
     * @notice Gets the delegator's reward at past moment based on a given epoch number and balance change index
     * @param pool the DelegationPool to query the claimable rewards from
     * @param delegator Address of the delegator
     * @param epochNumber Epoch number
     * @param balanceChangeIndex Index of the balance change
     */
    function _getRewardParams(
        DelegationPool storage pool,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) private view returns (uint256 rps, uint256 balance, int256 correction) {
        uint256 rewardPerShare = pool.historyRPS[epochNumber].value;
        (uint256 balanceData, int256 correctionData) = _getAccountParams(
            pool,
            delegator,
            epochNumber,
            balanceChangeIndex
        );

        return (rewardPerShare, balanceData, correctionData);
    }

    /**
     * @notice Saves the RPS for the given staker for the epoch
     * @param pool the DelegationPool to save the RPS for
     * @param rewardPerShare Amount of tokens to be withdrawn
     * @param epochNumber Epoch number
     */
    function _saveEpochRPS(DelegationPool storage pool, uint256 rewardPerShare, uint256 epochNumber) private {
        require(pool.historyRPS[epochNumber].timestamp == 0, "RPS already saved");

        pool.historyRPS[epochNumber] = RPS({value: uint192(rewardPerShare), timestamp: uint64(block.timestamp)});
    }

    /**
     * @notice Gets the account specific pool params for the given epoch
     * @param pool the DelegationPool to query the account params from
     * @param delegator Address of the vest manager
     * @param epochNumber Epoch number
     * @param paramsIndex Index of the params
     */
    function _getAccountParams(
        DelegationPool storage pool,
        address delegator,
        uint256 epochNumber,
        uint256 paramsIndex
    ) private view returns (uint256 balance, int256 correction) {
        if (paramsIndex >= pool.delegatorsParamsHistory[delegator].length) {
            revert DelegateRequirement({src: "vesting", msg: "INVALID_PARAMS_INDEX"});
        }

        DelegationPoolDelegatorParams memory params = pool.delegatorsParamsHistory[delegator][paramsIndex];
        if (params.epochNum > epochNumber) {
            revert DelegateRequirement({src: "vesting", msg: "LATE_BALANCE_CHANGE"});
        } else if (params.epochNum < epochNumber && paramsIndex != pool.delegatorsParamsHistory[delegator].length - 1) {
            // If balance change is not made exactly in the epoch with the given index, but in earlier epoch
            // And if this is not the last balance change - there is a chance of having a better balance change
            // in a next epoch (again before the passed one). So we need to check does the next one can be better
            DelegationPoolDelegatorParams memory nextParamsRecord = pool.delegatorsParamsHistory[delegator][
                paramsIndex + 1
            ];
            if (nextParamsRecord.epochNum <= epochNumber) {
                // If the next balance change is made in an epoch before the handled one or in the same epoch
                // - the provided one is not valid.
                // Because when the reward was distributed for the given epoch, the account balance was different
                revert DelegateRequirement({src: "vesting", msg: "EARLY_BALANCE_CHANGE"});
            }
        }

        return (params.balance, params.correction);
    }

    /**
     * @notice Saves the account specific pool params change
     * * @param pool the DelegationPool to save the account params for
     * @param delegator Address of the delegator
     */
    function _saveAccountParamsChange(DelegationPool storage pool, address delegator, uint256 epochNumber) private {
        if (isBalanceChangeMade(pool, delegator, epochNumber)) {
            // balance can be changed only once per epoch
            revert DelegateRequirement({src: "_saveAccountParamsChange", msg: "BALANCE_CHANGE_ALREADY_MADE"});
        }

        pool.delegatorsParamsHistory[delegator].push(
            DelegationPoolDelegatorParams({
                balance: balanceOf(pool, delegator),
                correction: correctionOf(pool, delegator),
                epochNum: epochNumber
            })
        );
    }

    // TODO: Check if the commitEpoch is the last transaction in the epoch, otherwise bug may occur
    function isBalanceChangeMade(
        DelegationPool storage pool,
        address delegator,
        uint256 currentEpochNum
    ) internal view returns (bool) {
        uint256 length = pool.delegatorsParamsHistory[delegator].length;
        if (length == 0) {
            return false;
        }

        DelegationPoolDelegatorParams memory data = pool.delegatorsParamsHistory[delegator][length - 1];

        if (data.epochNum == currentEpochNum) {
            return true;
        }

        return false;
    }
}
