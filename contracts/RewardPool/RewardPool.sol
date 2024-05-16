// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./RewardPoolBase.sol";
import "./../common/System/System.sol";
import "./modules/StakingRewards.sol";
import "./modules/DelegationRewards.sol";

import "./libs/DelegationPoolLib.sol";
import "./libs/VestingPositionLib.sol";

/**
 * @title Reward Pool
 * @notice The Reward Pool contract is responsible for distributing rewards to validators and delegators
 * based on the uptime and the amount of stake and delegation.
 */
contract RewardPool is RewardPoolBase, System, StakingRewards, DelegationRewards {
    using VestingPositionLib for VestingPosition;
    using DelegationPoolLib for DelegationPool;

    /// @notice Reward Wallet
    address public rewardWallet;
    /// @notice Mapping used to keep the paid rewards per epoch
    mapping(uint256 => uint256) public paidRewardPerEpoch;

    // _______________ Initializer _______________

    function initialize(
        IValidatorSet newValidatorSet,
        address newRewardWallet,
        uint256 newMinDelegation,
        address manager
    ) external initializer onlySystemCall {
        __RewardPoolBase_init(newValidatorSet);
        __DelegationRewards_init(newMinDelegation);
        __APR_init(manager);
        _initialize(newRewardWallet, newValidatorSet);
    }

    function _initialize(address newRewardWallet, IValidatorSet newValidatorSet) private {
        require(newRewardWallet != address(0) && address(newValidatorSet) != address(0), "ZERO_ADDRESS");
        rewardWallet = newRewardWallet;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IRewardPool
     */
    function distributeRewardsFor(
        uint256 epochId,
        Uptime[] calldata uptime,
        uint256 epochSize
    ) external payable onlySystemCall {
        require(paidRewardPerEpoch[epochId] == 0, "REWARD_ALREADY_DISTRIBUTED");

        uint256 totalBlocks = validatorSet.totalBlocks(epochId);
        require(totalBlocks != 0, "EPOCH_NOT_COMMITTED");

        uint256 totalSupply = validatorSet.totalSupply();
        uint256 rewardIndex = _calcRewardIndex(totalSupply, epochSize, totalBlocks);
        uint256 length = uptime.length;
        uint256 totalReward = 0;
        for (uint256 i = 0; i < length; ++i) {
            totalReward += _distributeReward(epochId, uptime[i], rewardIndex, totalSupply, totalBlocks);
        }

        paidRewardPerEpoch[epochId] = totalReward;
    }

    // _______________ Private functions _______________

    function _distributeReward(
        uint256 epochId,
        Uptime calldata uptime,
        uint256 fullReward,
        uint256 totalSupply,
        uint256 totalBlocks
    ) private returns (uint256 reward) {
        require(uptime.signedBlocks <= totalBlocks, "SIGNED_BLOCKS_EXCEEDS_TOTAL");

        (, , uint256 totalStake, uint256 commission, , ) = validatorSet.getValidator(uptime.validator);

        DelegationPool storage delegationPool = delegationPools[uptime.validator];
        // slither-disable-next-line divide-before-multiply
        uint256 validatorReward = (fullReward * (totalStake + delegationPool.supply) * uptime.signedBlocks) /
            (totalSupply * totalBlocks);
        (uint256 validatorShares, uint256 delegatorShares) = _calculateValidatorAndDelegatorShares(
            totalStake,
            delegationPool.supply,
            validatorReward,
            commission
        );

        _distributeValidatorReward(uptime.validator, validatorShares);
        _distributeDelegatorReward(uptime.validator, delegatorShares);

        // Keep history record of the rewardPerShare to be used on reward claim
        if (delegatorShares > 0) {
            _saveEpochRPS(uptime.validator, delegationPool.magnifiedRewardPerShare, epochId);
        }

        // Keep history record of the validator rewards to be used on maturing vesting reward claim
        if (validatorShares > 0) {
            _saveValRewardData(uptime.validator, epochId);
        }

        // Update the validator's last activity
        validatorSet.updateValidatorParticipation(uptime.validator);

        return validatorReward;
    }

    function _distributeValidatorReward(address validator, uint256 reward) private {
        VestingPosition memory position = positions[validator];
        if (position.isActive()) {
            reward = _applyCustomReward(position, reward, true);
        } else {
            reward = _applyCustomReward(reward);
        }

        valRewards[validator].total += reward;

        emit ValidatorRewardDistributed(validator, reward);
    }

    function _distributeDelegatorReward(address validator, uint256 reward) private {
        delegationPools[validator].distributeReward(reward);
        emit DelegatorRewardDistributed(validator, reward);
    }

    /**
     * Calculates the epoch reward index.
     * We call it index because it is not the actual reward
     * but only the macroFactor and the blocksCreated/totalEpochBlocks ratio are aplied here.
     * The participation factor is applied later in the distribution process.
     * (base + vesting and RSI are applied on claimReward for delegators
     * and on _distributeValidatorReward for validators)
     * @param activeStake Total active stake for the epoch
     * @param totalBlocks Number of blocks in the epoch
     * @param epochSize Expected size (number of blocks) of the epoch
     */
    function _calcRewardIndex(
        uint256 activeStake,
        uint256 epochSize,
        uint256 totalBlocks
    ) private view returns (uint256) {
        uint256 modifiedEpochReward = applyMacro(activeStake);

        return (modifiedEpochReward * totalBlocks) / (epochSize);
    }

    function _calculateValidatorAndDelegatorShares(
        uint256 stakedBalance,
        uint256 delegatedBalance,
        uint256 totalReward,
        uint256 commission
    ) private pure returns (uint256, uint256) {
        if (stakedBalance == 0) return (0, 0);
        if (delegatedBalance == 0) return (totalReward, 0);
        uint256 validatorReward = (totalReward * stakedBalance) / (stakedBalance + delegatedBalance);
        uint256 delegatorReward = totalReward - validatorReward;
        uint256 validatorCommission = (commission * delegatorReward) / 100;

        return (validatorReward + validatorCommission, delegatorReward - validatorCommission);
    }
}
