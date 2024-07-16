// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "./../common/Governed/Governed.sol";
import {Withdrawal} from "./../common/Withdrawal/Withdrawal.sol";
import {APRCalculatorConnector} from "./../APRCalculator/APRCalculatorConnector.sol";
import {HydraStakingConnector} from "./../HydraStaking/HydraStakingConnector.sol";
import {HydraChainConnector} from "./../HydraChain/HydraChainConnector.sol";
import {DelegationPoolLib} from "./DelegationPoolLib.sol";
import {IDelegation, DelegationPool} from "./IDelegation.sol";

contract Delegation is IDelegation, Governed, Withdrawal, APRCalculatorConnector, HydraStakingConnector, HydraChainConnector {
    using DelegationPoolLib for DelegationPool;

    /// @notice A constant for the minimum delegation limit
    uint256 public constant MIN_DELEGATION_LIMIT = 1 ether;

    /// @notice Keeps the delegation pools
    mapping(address => DelegationPool) public delegationPools;
    // @note maybe this must be part of the HydraChain
    /// @notice The minimum delegation amount to be delegated
    uint256 public minDelegation;

    uint256 internal _totalDelegation;

    // _______________ Initializer _______________

    function __Delegation_init(address _governace) internal onlyInitializing {
        __Governed_init(_governace);
        __Withdrawal_init(_governace);
        __Delegation_init_unchained();
    }

    function __Delegation_init_unchained() internal onlyInitializing {
        _changeMinDelegation(MIN_DELEGATION_LIMIT);
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
    function totalDelegation() external view returns (uint256) {
        return _totalDelegation;
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
    function getRawDelegatorReward(address staker, address delegator) public view returns (uint256) {
        DelegationPool storage delegation = delegationPools[staker];
        return delegation.claimableRewards(delegator);
    }

    /**
     * @inheritdoc IDelegation
     */
    function getDelegatorReward(address staker, address delegator) external view returns (uint256) {
        DelegationPool storage delegation = delegationPools[staker];
        uint256 reward = delegation.claimableRewards(delegator);
        return aprCalculatorContract.applyBaseAPR(reward);
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

        delegation.deposit(delegator, amount);
        _totalDelegation += amount;

        hydraStakingContract.onDelegate(staker);

        emit Delegated(staker, delegator, amount);
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

        delegation.withdraw(delegator, amount);
        _totalDelegation -= amount;

        hydraStakingContract.onUndelegate(staker);

        emit Undelegated(staker, delegator, amount);
    }

    /**
     * @notice Distributes rewards to a delegator
     * @param staker Address of the validator
     * @param reward Amount to distribute
     */
    function _distributeDelegationRewards(address staker, uint256 reward) internal virtual {
        delegationPools[staker].distributeReward(reward);
        emit DelegatorRewardDistributed(staker, reward);
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
     * @notice Claims rewards for a delegator
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     */
    function _claimDelegatorReward(address staker, address delegator) private {
        DelegationPool storage delegation = delegationPools[staker];
        uint256 rewardIndex = delegation.claimRewards(delegator);
        uint256 reward = aprCalculatorContract.applyBaseAPR(rewardIndex);
        if (reward == 0) return;

        emit DelegatorRewardsClaimed(staker, delegator, reward);

        _withdraw(delegator, reward);
    }
}
