// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IWithdrawal} from "../common/Withdrawal/IWithdrawal.sol";

interface IDelegation is IWithdrawal {
    event Delegated(address indexed staker, address indexed delegator, uint256 amount);
    event Undelegated(address indexed staker, address indexed delegator, uint256 amount);
    event DelegatorRewardsClaimed(address indexed staker, address indexed delegator, uint256 amount);
    event DelegatorRewardDistributed(address indexed staker, uint256 amount);

    error DelegateRequirement(string src, string msg);
    error InvalidMinDelegation();

    /**
     * @notice Returns the total delegation amount
     */
    function totalDelegation() external view returns (uint256);

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
     * @notice Gets delegator's unclaimed rewards (without custom APR params applied)
     * @param staker Address of validator
     * @param delegator Address of delegator
     * @return Delegator's unclaimed rewards per staker (in HYDRA wei)
     */
    function getRawDelegatorReward(address staker, address delegator) external view returns (uint256);

    /**
     * @notice Gets delegator's unclaimed rewards (with custom APR params applied)
     * @param staker Address of validator
     * @param delegator Address of delegator
     * @return Delegator's unclaimed rewards per staker (in HYDRA wei)
     */
    function getDelegatorReward(address staker, address delegator) external view returns (uint256);

    /**
     * @notice Delegates sent amount to staker and claims rewards.
     * @param staker Validator to delegate to
     */
    function delegate(address staker) external payable;

    /**
     * @notice Undelegates amount from staker for sender and claims rewards.
     * @param staker Validator to undelegate from
     * @param amount The amount to undelegate
     */
    function undelegate(address staker, uint256 amount) external;

    /**
     * @notice Claims rewards for delegator for staker
     * @param staker Address of the validator
     */
    function claimDelegatorReward(address staker) external;

    /**
     * @notice Changes the minimum delegation amount
     * @dev Only callable by the admin
     * @param newMinDelegation New minimum delegation amount
     */
    function changeMinDelegation(uint256 newMinDelegation) external;
}
