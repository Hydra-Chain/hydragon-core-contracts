// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

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
    Withdrawal,
    APRCalculatorConnector,
    HydraStakingConnector,
    HydraChainConnector,
    RewardWalletConnector
{
    using DelegationPoolLib for DelegationPool;

    /// @notice A constant for the minimum delegation limit
    uint256 public constant MIN_DELEGATION_LIMIT = 1 ether;
    /// @notice A constant for the maximum commission a validator can receive from the delegator's rewards
    uint256 public constant MAX_COMMISSION = 100;

    /// @notice The commission per staker in percentage
    mapping(address => uint256) public delegationCommissionPerStaker;
    /// @notice The pending commission per staker in percentage
    mapping(address => uint256) public pendingCommissionPerStaker;
    /// @notice Timestamp after which the commission can be updated
    mapping(address => uint256) public commissionUpdateAvailableAt;
    /// @notice The commission reward for the staker
    mapping(address => uint256) public distributedCommissions;
    /// @notice If the commission is locked for the staker
    mapping(address => bool) public commissionRewardLocked;
    /// @notice Keeps the delegation pools
    mapping(address => DelegationPool) public delegationPools;
    /// @notice The minimum delegation amount to be delegated
    uint256 public minDelegation;

    uint256 internal _totalDelegation;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Delegation_init(
        StakerInit[] calldata initialStakers,
        uint256 initialCommission,
        address governance,
        address aprCalculatorAddr,
        address hydraChainAddr,
        address hydraStakingAddr,
        address rewardWalletAddr
    ) internal onlyInitializing {
        __Withdrawal_init(governance);
        __APRCalculatorConnector_init(aprCalculatorAddr);
        __HydraStakingConnector_init(hydraStakingAddr);
        __HydraChainConnector_init(hydraChainAddr);
        __RewardWalletConnector_init(rewardWalletAddr);
        __Delegation_init_unchained(initialStakers, initialCommission);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Delegation_init_unchained(
        StakerInit[] calldata initialStakers,
        uint256 initialCommission
    ) internal onlyInitializing {
        _changeMinDelegation(MIN_DELEGATION_LIMIT);
        for (uint256 i = 0; i < initialStakers.length; i++) {
            _setCommission(initialStakers[i].addr, initialCommission);
        }
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDelegation
     */
    function changeMinDelegation(uint256 newMinDelegation) external onlyGovernance {
        _changeMinDelegation(newMinDelegation);
    }

    /**
     * @inheritdoc IDelegation
     */
    function setInitialCommission(address staker, uint256 initialCommission) external onlyHydraChain {
        _setCommission(staker, initialCommission);
    }

    /**
     * @inheritdoc IDelegation
     */
    function setPendingCommission(uint256 newCommission) external {
        _setPendingCommission(msg.sender, newCommission);
    }

    /**
     * @inheritdoc IDelegation
     */
    function applyPendingCommission() external {
        _applyPendingCommission(msg.sender);
    }

    /**
     * @inheritdoc IDelegation
     */
    function claimCommission(address to) external {
        if (commissionRewardLocked[msg.sender]) revert CommissionRewardLocked();
        _claimCommission(msg.sender, to);
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
    function lockCommissionReward(address staker) external onlyHydraChain {
        commissionRewardLocked[staker] = true;
    }

    /**
     * @inheritdoc IDelegation
     */
    function unlockCommissionReward(address staker) external onlyHydraChain {
        commissionRewardLocked[staker] = false;
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
    function getDelegatorReward(address staker, address delegator) external view returns (uint256) {
        uint256 rawReward = getRawReward(staker, delegator);
        uint256 reward = aprCalculatorContract.applyBaseAPR(rawReward);
        uint256 commission = delegationCommissionPerStaker[staker];
        if (commission != 0) {
            (, reward) = _applyCommission(reward, commission);
        }

        return reward;
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
     * @notice Core logic for delegating funds to a staker
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param amount Amount to delegate
     */
    function _baseDelegate(address staker, address delegator, uint256 amount) internal {
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
     * @dev overriden in child contracts to extend core undelegate behaviour
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param amount Amount to delegate
     */
    function _undelegate(address staker, address delegator, uint256 amount) internal virtual {
        _baseUndelegate(staker, delegator, amount);
    }

    /**
     * @notice Core logic for undelegating funds from a staker
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @param amount Amount to delegate
     */
    function _baseUndelegate(address staker, address delegator, uint256 amount) internal {
        DelegationPool storage delegation = delegationPools[staker];
        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (amount > delegatedAmount) revert DelegateRequirement({src: "undelegate", msg: "INSUFFICIENT_BALANCE"});

        uint256 amountAfterUndelegate;
        unchecked {
            amountAfterUndelegate = delegatedAmount - amount;
        }

        if (amountAfterUndelegate < minDelegation && amountAfterUndelegate != 0)
            revert DelegateRequirement({src: "undelegate", msg: "DELEGATION_TOO_LOW"});

        _withdrawDelegation(staker, delegation, delegator, amount);
        _totalDelegation -= amount;

        hydraStakingContract.onUndelegate(staker);

        emit Undelegated(staker, delegator, amount);
    }

    /**
     * @notice Withdraws funds from stakers pool
     * @dev overriden in child contracts to extend core withdraw behaviour
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
     * @notice Set commission for staker from pending commission
     * @param staker Address of the validator
     */
    function _applyPendingCommission(address staker) private {
        if (commissionUpdateAvailableAt[staker] > block.timestamp) revert CommissionUpdateNotAvailable();

        uint256 pendingCommission = pendingCommissionPerStaker[staker];
        delegationCommissionPerStaker[staker] = pendingCommission;

        emit CommissionUpdated(staker, pendingCommission);
    }

    /**
     * @notice Set pending commission for staker (to be applied later)
     * @param staker Address of the validator
     * @param newCommission New commission (100 = 100%)
     */
    function _setPendingCommission(address staker, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission();

        commissionUpdateAvailableAt[staker] = block.timestamp + 15 days;
        pendingCommissionPerStaker[staker] = newCommission;

        emit PendingCommissionAdded(staker, newCommission);
    }

    /**
     * @notice Set commission for staker
     * @param staker Address of the validator
     * @param newCommission New commission (100 = 100%)
     */
    function _setCommission(address staker, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission();

        delegationCommissionPerStaker[staker] = newCommission;

        emit CommissionUpdated(staker, newCommission);
    }

    /**
     * @notice Claims distributed commission for staker
     * @param staker Address of the validator
     * @param to Address of person to send the commission to
     */
    function _claimCommission(address staker, address to) private {
        uint256 commissionReward = distributedCommissions[staker];
        if (commissionReward == 0) revert NoCommissionToClaim();

        distributedCommissions[staker] = 0;
        rewardWalletContract.distributeReward(to, commissionReward);

        emit CommissionClaimed(staker, to, commissionReward);
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

        // Distribute commission to staker if available
        uint256 commission = delegationCommissionPerStaker[staker];
        if (commission != 0) {
            uint256 stakerCut;
            (stakerCut, reward) = _applyCommission(reward, commission);
            distributedCommissions[staker] += stakerCut;
            emit CommissionDistributed(staker, delegator, stakerCut);
        }

        // Distribute reward to delegator
        rewardWalletContract.distributeReward(delegator, reward);
        emit DelegatorRewardsClaimed(staker, delegator, reward);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
