// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "../common/Governed/Governed.sol";
import {Withdrawal} from "../common/Withdrawal/Withdrawal.sol";
import {DelegateRequirement} from "../common/Errors.sol";
import {StakerInit} from "../HydraStaking/IHydraStaking.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {HydraStakingConnector} from "../HydraStaking/HydraStakingConnector.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {RewardWalletConnector} from "../RewardWallet/RewardWalletConnector.sol";
import {DelegationPoolLib} from "./modules/DelegationPoolLib/DelegationPoolLib.sol";
import {DelegationPool} from "./modules/DelegationPoolLib/IDelegationPoolLib.sol";
import {IDelegation} from "./IDelegation.sol";

contract Delegation is
    IDelegation,
    Governed,
    Withdrawal,
    APRCalculatorConnector,
    HydraStakingConnector,
    HydraChainConnector,
    RewardWalletConnector
{
    using DelegationPoolLib for DelegationPool;

    /// @notice A constant for the minimum delegation limit
    uint256 public constant MIN_DELEGATION_LIMIT = 1 ether;
    /// @notice A constant for the maximum comission a validator can receive from the delegator's rewards
    uint256 public constant MAX_COMMISSION = 100;

    /// @notice The commission per staker in percentage
    mapping(address => uint256) public delegationCommissionPerStaker;
    /// @notice Timestamp after which the commission can be updated
    mapping(address => uint256) public commissionUpdateAvailableAt;
    /// @notice Keeps the delegation pools
    mapping(address => DelegationPool) public delegationPools;
    /// @notice The minimum delegation amount to be delegated
    uint256 public minDelegation;

    uint256 internal _totalDelegation;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Delegation_init(
        address _governance,
        address _rewardWalletAddr,
        StakerInit[] calldata _initialStakers,
        uint256 _initialCommission
    ) internal onlyInitializing {
        __Governed_init(_governance);
        __Withdrawal_init(_governance);
        __RewardWalletConnector_init(_rewardWalletAddr);
        __Delegation_init_unchained(_initialStakers, _initialCommission);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Delegation_init_unchained(
        StakerInit[] calldata _initialStakers,
        uint256 _initialCommission
    ) internal onlyInitializing {
        _changeMinDelegation(MIN_DELEGATION_LIMIT);
        for (uint256 i = 0; i < _initialStakers.length; i++) {
            _setCommission(_initialStakers[i].addr, _initialCommission);
        }
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDelegation
     */
    function changeMinDelegation(uint256 newMinDelegation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _changeMinDelegation(newMinDelegation);
    }

    /**
     * @inheritdoc IDelegation
     */
    function setCommission(uint256 newCommission) external {
        _setCommission(msg.sender, newCommission);
    }

    /**
     * @inheritdoc IDelegation
     */
    function claimDelegatorReward(address staker) external {
        _claimDelegatorReward(staker, msg.sender);
    }

    /**
     * @inheritdoc IDelegation
     */
    function undelegate(address staker, uint256 amount) external {
        _claimDelegatorReward(staker, msg.sender);
        _undelegate(staker, msg.sender, amount);
        _registerWithdrawal(msg.sender, amount);
    }

    /**
     * @inheritdoc IDelegation
     */
    function totalDelegation() external view returns (uint256) {
        return _totalDelegation;
    }

    /**
     * @inheritdoc IDelegation
     */
    function getRawDelegatorReward(address staker, address delegator) external view returns (uint256) {
        uint256 reward = getRawReward(staker, delegator);
        uint256 commission = delegationCommissionPerStaker[staker];
        if (commission == 0) return reward;

        (, uint256 rawDelegatorReward) = _applyCommission(reward, commission);
        return rawDelegatorReward;
    }

    /**
     * @inheritdoc IDelegation
     */
    function getDelegatorReward(address staker, address delegator) external view returns (uint256) {
        uint256 reward = getRawReward(staker, delegator);
        uint256 aprReward = aprCalculatorContract.applyBaseAPR(reward);
        uint256 commission = delegationCommissionPerStaker[staker];
        if (commission == 0) return aprReward;

        (, uint256 delegatorReward) = _applyCommission(aprReward, commission);
        return delegatorReward;
    }

    /**
     * @inheritdoc IDelegation
     */
    function stakerDelegationCommission(address staker) external view returns (uint256) {
        return delegationCommissionPerStaker[staker];
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IDelegation
     */
    function delegate(address staker) public payable {
        _claimDelegatorReward(staker, msg.sender);
        _delegate(staker, msg.sender, msg.value);
    }

    /**
     * @inheritdoc IDelegation
     */
    function delegationOf(address staker, address delegator) public view returns (uint256) {
        return delegationPools[staker].balanceOf(delegator);
    }

    /**
     * @inheritdoc IDelegation
     */
    function totalDelegationOf(address staker) public view returns (uint256) {
        return delegationPools[staker].supply;
    }

    /**
     * @inheritdoc IDelegation
     */
    function getRawReward(address staker, address delegator) public view returns (uint256) {
        DelegationPool storage delegation = delegationPools[staker];
        return delegation.claimableRewards(delegator);
    }

    // _______________ Internal functions _______________

    /**
     * @notice Delegates funds to a staker
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param amount Amount to delegate
     */
    function _delegate(address staker, address delegator, uint256 amount) internal virtual {
        _baseDelegate(staker, delegator, amount);
    }

    /**
     * @notice Base delegation funds to a staker
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param amount Amount to delegate
     */
    function _baseDelegate(address staker, address delegator, uint256 amount) internal virtual {
        if (amount == 0) revert DelegateRequirement({src: "delegate", msg: "DELEGATING_AMOUNT_ZERO"});
        DelegationPool storage delegation = delegationPools[staker];
        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (delegatedAmount + amount < minDelegation)
            revert DelegateRequirement({src: "delegate", msg: "DELEGATION_TOO_LOW"});

        _depositDelegation(staker, delegation, delegator, amount);
        _totalDelegation += amount;

        hydraStakingContract.onDelegate(staker);

        emit Delegated(staker, delegator, amount);
    }

    /**
     * @notice Deposits funds in stakers pool
     * @param delegation Delegation pool
     * @param delegator Address of the delegator
     * @param amount Amount to deposit
     */
    function _depositDelegation(
        address /**staker*/,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual {
        delegation.deposit(delegator, amount);
    }

    /**
     * @notice Undelegates funds from a staker
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param amount Amount to delegate
     */
    function _undelegate(address staker, address delegator, uint256 amount) internal virtual {
        _baseUndelegate(staker, delegator, amount);
    }

    /**
     * @notice Base undelegating funds from a staker
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param amount Amount to delegate
     */
    function _baseUndelegate(address staker, address delegator, uint256 amount) internal virtual {
        DelegationPool storage delegation = delegationPools[staker];
        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (amount > delegatedAmount) revert DelegateRequirement({src: "undelegate", msg: "INSUFFICIENT_BALANCE"});

        uint256 amounAfterUndelegate;
        unchecked {
            amounAfterUndelegate = delegatedAmount - amount;
        }

        if (amounAfterUndelegate < minDelegation && amounAfterUndelegate != 0)
            revert DelegateRequirement({src: "undelegate", msg: "DELEGATION_TOO_LOW"});

        _withdrawDelegation(staker, delegation, delegator, amount);
        _totalDelegation -= amount;

        hydraStakingContract.onUndelegate(staker);

        emit Undelegated(staker, delegator, amount);
    }

    /**
     * @notice Withdraws funds from stakers pool
     * @param delegation Delegation pool
     * @param delegator Address of the delegator
     * @param amount Amount to withdraw
     */
    function _withdrawDelegation(
        address /**staker*/,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual {
        delegation.withdraw(delegator, amount);
    }

    /**
     * @notice Distributes rewards to a delegator
     * @param staker Address of the validator
     * @param reward Amount to distribute
     * @param epochId The epoch number
     */
    function _distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) internal virtual {
        delegationPools[staker].distributeReward(reward, epochId);

        emit DelegatorRewardDistributed(staker, reward);
    }

    /**
     * @notice Applies the commission to the reward
     * @param reward The reward to apply the commission
     * @param commission The commission to apply
     * @return stakerCut The commission cut for the staker
     * @return delegatorReward The reward for the delegator
     */
    function _applyCommission(
        uint256 reward,
        uint256 commission
    ) internal pure returns (uint256 stakerCut, uint256 delegatorReward) {
        stakerCut = (reward * commission) / 100;
        delegatorReward = reward - stakerCut;
    }

    // _______________ Private functions _______________

    /**
     * @notice Changes the minimum delegation amount
     * @param newMinDelegation the new minimum delegation amount
     */
    function _changeMinDelegation(uint256 newMinDelegation) private {
        if (newMinDelegation < MIN_DELEGATION_LIMIT) revert InvalidMinDelegation();
        minDelegation = newMinDelegation;
    }

    /**
     * @notice Set commission for staker
     * @param staker Address of the validator
     * @param newCommission New commission (100 = 100%)
     */
    function _setCommission(address staker, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission(newCommission);
        if (commissionUpdateAvailableAt[staker] > block.timestamp) revert CommissionUpdateNotAvailable();

        commissionUpdateAvailableAt[staker] = block.timestamp + 30 days;
        delegationCommissionPerStaker[staker] = newCommission;

        emit CommissionUpdated(staker, newCommission);
    }

    /**
     * @notice Claims rewards for a delegator
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     */
    function _claimDelegatorReward(address staker, address delegator) private {
        DelegationPool storage delegation = delegationPools[staker];
        uint256 rewardIndex = delegation.claimRewards(delegator);
        uint256 reward = aprCalculatorContract.applyBaseAPR(rewardIndex);
        if (reward == 0) return;

        uint256 commission = delegationCommissionPerStaker[staker];
        if (commission == 0) {
            rewardWalletContract.distributeReward(delegator, reward);
            emit DelegatorRewardsClaimed(staker, delegator, reward);
        } else {
            (uint256 stakerCut, uint256 delegatorReward) = _applyCommission(reward, commission);

            rewardWalletContract.distributeReward(staker, stakerCut);
            rewardWalletContract.distributeReward(delegator, delegatorReward);

            emit CommissionClaimed(staker, delegator, stakerCut);
            emit DelegatorRewardsClaimed(staker, delegator, delegatorReward);
        }
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
