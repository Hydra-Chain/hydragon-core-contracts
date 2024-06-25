// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "./../common/Governed/Governed.sol";
import {Withdrawal} from "./../common/Withdrawal/Withdrawal.sol";
import {APRCalculatorConnector} from "./../APRCalculator/APRCalculatorConnector.sol";
import {DelegationPoolLib} from "./DelegationPoolLib.sol";
import {IDelegation, DelegationPool} from "./IDelegation.sol";

contract Delegation is IDelegation, Governed, Withdrawal, APRCalculatorConnector {
    using DelegationPoolLib for DelegationPool;

    /// @notice A constant for the minimum delegation limit
    uint256 public constant MIN_DELEGATION_LIMIT = 1 ether;

    /// @notice Keeps the delegation pools
    mapping(address => DelegationPool) public delegationPools;
    // @note maybe this must be part of the ValidatorSet
    /// @notice The minimum delegation amount to be delegated
    uint256 public minDelegation;

    uint256 internal _totalDelegation;

    function delegationOf(address staker, address delegator) public view returns (uint256) {
        return delegationPools[staker].balanceOf(delegator);
    }

    function totalDelegationOf(address staker) public view returns (uint256) {
        return delegationPools[staker].supply;
    }

    function totalDelegation() external view returns (uint256) {
        return _totalDelegation;
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
    function delegate(address validator) public payable {
        _claimDelegatorReward(validator, msg.sender);
        _delegate(validator, msg.sender, msg.value);
    }

    /**
     * @inheritdoc IDelegation
     */
    function undelegate(address staker, uint256 amount) external {
        _claimDelegatorReward(staker, msg.sender);
        _undelegate(staker, msg.sender, amount);
        _registerWithdrawal(msg.sender, amount);
    }

    function _delegate(address staker, address delegator, uint256 amount) internal virtual {
        _baseDelegate(staker, delegator, amount);
    }

    function _baseDelegate(address staker, address delegator, uint256 amount) internal virtual {
        if (msg.value == 0) revert DelegateRequirement({src: "delegate", msg: "DELEGATING_AMOUNT_ZERO"});
        DelegationPool storage delegation = delegationPools[staker];
        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (delegatedAmount + amount < minDelegation)
            revert DelegateRequirement({src: "delegate", msg: "DELEGATION_TOO_LOW"});

        delegation.deposit(delegator, amount);
        _totalDelegation += amount;

        emit Delegated(staker, delegator, amount);
    }

    function _undelegate(address validator, address delegator, uint256 amount) internal virtual {
        _baseUndelegate(validator, delegator, amount);
    }

    function _baseUndelegate(address validator, address delegator, uint256 amount) internal virtual {
        DelegationPool storage delegation = delegationPools[validator];
        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (amount > delegatedAmount) revert DelegateRequirement({src: "undelegate", msg: "INSUFFICIENT_BALANCE"});

        uint256 amounAfterUndelegate = delegatedAmount - amount;
        if (amounAfterUndelegate < minDelegation && amounAfterUndelegate != 0)
            revert DelegateRequirement({src: "undelegate", msg: "DELEGATION_TOO_LOW"});

        delegation.withdraw(delegator, amount);
        _totalDelegation -= amount;

        emit Undelegated(validator, delegator, amount);
    }

    function _claimDelegatorReward(address validator, address delegator) private {
        DelegationPool storage delegation = delegationPools[validator];
        uint256 rewardIndex = delegation.claimRewards(delegator);
        uint256 reward = aprCalculatorContract.applyBaseAPR(rewardIndex);
        if (reward == 0) return;

        emit DelegatorRewardClaimed(validator, delegator, reward);

        _withdraw(delegator, reward);
    }

    function _distributeDelegationRewards(address staker, uint256 reward) internal virtual {
        delegationPools[staker].distributeReward(reward);
        emit DelegatorRewardDistributed(staker, reward);
    }
}
