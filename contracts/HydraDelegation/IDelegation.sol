// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IWithdrawal} from "./../common/Withdrawal/IWithdrawal.sol";

struct DelegationPool {
    uint256 supply;
    uint256 virtualSupply;
    uint256 magnifiedRewardPerShare;
    address validator;
    mapping(address => int256) magnifiedRewardCorrections;
    mapping(address => uint256) claimedRewards;
    mapping(address => uint256) balances;
}

interface IDelegation is IWithdrawal {
    event Delegated(address indexed validator, address indexed delegator, uint256 amount);
    event Undelegated(address indexed validator, address indexed delegator, uint256 amount);
    event DelegatorRewardClaimed(address indexed staker, address indexed delegator, uint256 amount);
    event DelegatorRewardDistributed(address indexed staker, uint256 amount);

    error DelegateRequirement(string src, string msg);


    /**
     * @notice Returns the total delegation amount
     */
    function totalDelegation() external view returns (uint256);

    /**
     * @notice Claims rewards for delegator for validator
     * @param validator Address of the validator
     */
    function claimDelegatorReward(address validator) external;

    /**
     * @notice Undelegates amount from validator for sender and claims rewards.
     * @param validator Validator to undelegate from
     * @param amount The amount to undelegate
     */
    function undelegate(address validator, uint256 amount) external;

    // _______________ Public functions _______________

    /**
     * @notice Delegates sent amount to validator and claims rewards.
     * @param validator Validator to delegate to
     */
    function delegate(address validator) external payable;

    /**
     * @notice Returns the total amount of delegation for a staker
     * @param staker Address of the validator
     */
    function totalDelegationOf(address staker) external view returns (uint256);

    /**
     * @notice Return the amount of delegation for a delegator to a validator
     * @param staker Address of the validator
     * @param delegator Address of the delegator
     */
    function delegationOf(address staker, address delegator) external view returns (uint256);

    /**
     * @notice Gets delegator's unclaimed rewards index (without custom APR params applied)
     * @param validator Address of validator
     * @param delegator Address of delegator
     * @return Delegator's unclaimed rewards index per validator (in HYDRA wei)
     */
    function getRawDelegatorReward(address validator, address delegator) external view returns (uint256);

}
