// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// Reward Per Share
struct RPS {
    uint192 value;
    uint64 timestamp;
}

struct DelegationPoolDelegatorParams {
    uint256 balance;
    int256 correction;
    uint256 epochNum;
}

struct DelegationPool {
    uint256 supply;
    uint256 virtualSupply;
    uint256 magnifiedRewardPerShare;
    mapping(address => int256) magnifiedRewardCorrections;
    mapping(address => uint256) claimedRewards;
    mapping(address => uint256) balances;
    /**
     * @notice Keeps the history of the RPS for the stakers
     * @dev This is used to keep the history RPS in order to calculate properly the rewards
     */
    mapping(uint256 => RPS) historyRPS;
    /**
     * @notice Historical Staker Delegation Pool's Params per delegator
     * @dev Delegator => Pool params data
     */
    mapping(address => DelegationPoolDelegatorParams[]) delegatorsParamsHistory;
}
