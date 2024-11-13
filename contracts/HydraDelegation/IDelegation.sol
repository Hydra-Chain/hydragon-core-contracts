// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IWithdrawal} from "../common/Withdrawal/IWithdrawal.sol";

interface IDelegation is IWithdrawal {
    event Delegated(address indexed staker, address indexed delegator, uint256 amount);
    event Undelegated(address indexed staker, address indexed delegator, uint256 amount);
    event CommissionClaimed(address indexed staker, address indexed to, uint256 amount);
    event CommissionDistributed(address indexed staker, address indexed delegator, uint256 amount);
    event DelegatorRewardsClaimed(address indexed staker, address indexed delegator, uint256 amount);
    event DelegatorRewardDistributed(address indexed staker, uint256 amount);
    event CommissionUpdated(address indexed staker, uint256 newCommission);

    error InvalidCommission();
    error NoCommissionToClaim();
    error InvalidMinDelegation();
    error CommissionUpdateNotAvailable();

    /**
     * @notice Changes the minimum delegation amount
     * @dev Only callable by the admin
     * @param newMinDelegation New minimum delegation amount
     */
    function changeMinDelegation(uint256 newMinDelegation) external;

    /**
     * @notice Sets commission for staker.
     * @dev Anyone can set commission, but if the caller is not active validator, it will not have any effect.
     * @param newCommission New commission (100 = 100%)
     */
    function setCommission(uint256 newCommission) external;

    /**
     * @notice Claims commission for staker
     * @param to Address to send the commission to
     */
    function claimCommission(address to) external;

    /**
     * @notice Claims rewards for delegator and commissions for staker
     * @param staker Address of the validator
     */
    function claimDelegatorReward(address staker) external;

    /**
     * @notice Undelegates amount from staker for sender, claims rewards and validator comission.
     * @param staker Validator to undelegate from
     * @param amount The amount to undelegate
     */
    function undelegate(address staker, uint256 amount) external;

    /**
     * @notice Returns the total delegation amount
     */
    function totalDelegation() external view returns (uint256);

    /**
     * @notice Gets delegator's unclaimed rewards (with custom APR params)
     * @param staker Address of validator
     * @param delegator Address of delegator
     * @return Delegator's unclaimed rewards per staker (in HYDRA wei)
     */
    function getDelegatorReward(address staker, address delegator) external view returns (uint256);

    /**
     * @notice Returns commission for staker.
     * @param staker Address of the validator
     * @return commission Commission for staker
     */
    function stakerDelegationCommission(address staker) external view returns (uint256);

    // _______________ Public functions _______________

    /**
     * @notice Delegates sent amount to staker, claims rewards and validator comission.
     * @param staker Validator to delegate to
     */
    function delegate(address staker) external payable;

    /**
     * @notice Returns the total amount of delegation for a staker
     * @param staker Address of the validator
     */
    function totalDelegationOf(address staker) external view returns (uint256);

    /**
     * @notice Return the amount of delegation for a delegator to a staker
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     */
    function delegationOf(address staker, address delegator) external view returns (uint256);

    /**
     * @notice Returns the raw reward before applying the commission and APR
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     * @return Raw reward for the delegator before applying APR and commission
     */
    function getRawReward(address staker, address delegator) external view returns (uint256);
}
