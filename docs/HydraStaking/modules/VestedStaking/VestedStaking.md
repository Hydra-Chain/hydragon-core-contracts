# VestedStaking



> VestedStaking

An extension of the Staking contract that enables vesting the stake for a higher APY



## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### MIN_STAKE_LIMIT

```solidity
function MIN_STAKE_LIMIT() external view returns (uint256)
```

A constant for the minimum stake limit




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### acceptOwnership

```solidity
function acceptOwnership() external nonpayable
```



*The new owner accepts the ownership transfer.*


### aprCalculatorContract

```solidity
function aprCalculatorContract() external view returns (contract IAPRCalculator)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IAPRCalculator | undefined |

### calcVestedStakingPositionPenalty

```solidity
function calcVestedStakingPositionPenalty(address staker, uint256 amount) external view returns (uint256 penalty, uint256 reward)
```

Returns the penalty and reward that will be burned, if vested stake position is active



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |
| amount | uint256 | The amount that is going to be unstaked |

#### Returns

| Name | Type | Description |
|---|---|---|
| penalty | uint256 | for the staker |
| reward | uint256 | of the staker |

### calculatePositionClaimableReward

```solidity
function calculatePositionClaimableReward(address staker, uint256 rewardHistoryIndex) external view returns (uint256)
```

Calculates the staker&#39;s vested position claimable (already matured) rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |
| rewardHistoryIndex | uint256 | The index of the reward history at time that is already matured |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | claimable reward of the staker* |

### calculatePositionTotalReward

```solidity
function calculatePositionTotalReward(address staker) external view returns (uint256)
```

Calculates the staker&#39;s total (pending + claimable) rewards. Pending - such that are not matured so not claimable yet. Claimable - such that are matured and claimable.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Pending rewards expected by the vested staker&#39;s position (in HYDRA wei) |

### changeMinStake

```solidity
function changeMinStake(uint256 newMinStake) external nonpayable
```

Changes minimum stake required for stakers.

*Should be called by the Governance.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newMinStake | uint256 | New minimum stake |

### changeWithdrawalWaitPeriod

```solidity
function changeWithdrawalWaitPeriod(uint256 newWaitPeriod) external nonpayable
```

Changes the withdrawal wait period.

*This function should be called only by the Governed contract.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newWaitPeriod | uint256 | The new withdrawal wait period. MUST be longer than a single epoch (in some realistic worst-case scenario) in case somebody&#39;s stake needs to be penalized. |

### claimStakingRewards

```solidity
function claimStakingRewards() external nonpayable
```

Claims staking rewards for the sender.




### claimStakingRewards

```solidity
function claimStakingRewards(uint256 rewardHistoryIndex) external nonpayable
```

Claims staking rewards for the sender.



#### Parameters

| Name | Type | Description |
|---|---|---|
| rewardHistoryIndex | uint256 | The index of the reward history to claim rewards from |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### getStakingRewardsHistoryValues

```solidity
function getStakingRewardsHistoryValues(address staker) external view returns (struct StakingRewardsHistory[])
```

Returns historical records of the staking rewards of the user



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | StakingRewardsHistory[] | stakingRewardsHistory array with the historical records of the staking rewards of the user |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleGranted} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### minStake

```solidity
function minStake() external view returns (uint256)
```

A state variable to keep the minimum amount of stake




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pendingOwner

```solidity
function pendingOwner() external view returns (address)
```



*Returns the address of the pending owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pendingWithdrawals

```solidity
function pendingWithdrawals(address account) external view returns (uint256)
```

Calculates how much is yet to become withdrawable for account.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The account to calculate amount for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Amount not yet withdrawable (in wei) |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been revoked `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### rewardWalletContract

```solidity
function rewardWalletContract() external view returns (contract IRewardWallet)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IRewardWallet | undefined |

### stake

```solidity
function stake() external payable
```

Stakes sent amount.




### stakeOf

```solidity
function stakeOf(address account) external view returns (uint256)
```

Returns staked amount for the given account.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Staker address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### stakeWithVesting

```solidity
function stakeWithVesting(uint256 durationWeeks) external payable
```

Stakes sent amount with vesting period.



#### Parameters

| Name | Type | Description |
|---|---|---|
| durationWeeks | uint256 | Duration of the vesting in weeks. Must be between 1 and 52. |

### stakes

```solidity
function stakes(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### stakingRewards

```solidity
function stakingRewards(address) external view returns (uint256 taken, uint256 total)
```

The staking rewards mapped to a staker&#39;s address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| taken | uint256 | undefined |
| total | uint256 | undefined |

### stakingRewardsHistory

```solidity
function stakingRewardsHistory(address, uint256) external view returns (uint256 totalReward, uint256 epoch, uint256 timestamp)
```

Keeps the rewards history of the stakers



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| totalReward | uint256 | undefined |
| epoch | uint256 | undefined |
| timestamp | uint256 | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### totalStake

```solidity
function totalStake() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one. Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### unclaimedRewards

```solidity
function unclaimedRewards(address account) external view returns (uint256)
```

Returns unclaimed rewards for the given account.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Staker address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### unstake

```solidity
function unstake(uint256 amount) external nonpayable
```

Unstakes amount for sender. Claims rewards beforehand.



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | Amount to unstake |

### vestedStakingPositions

```solidity
function vestedStakingPositions(address) external view returns (uint256 duration, uint256 start, uint256 end, uint256 base, uint256 vestBonus, uint256 rsiBonus)
```

The stakers&#39; vesting positions



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| duration | uint256 | undefined |
| start | uint256 | undefined |
| end | uint256 | undefined |
| base | uint256 | undefined |
| vestBonus | uint256 | undefined |
| rsiBonus | uint256 | undefined |

### withdraw

```solidity
function withdraw(address to) external nonpayable
```

Withdraws sender&#39;s withdrawable amount to specified address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | Address to withdraw to |

### withdrawWaitPeriod

```solidity
function withdrawWaitPeriod() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### withdrawable

```solidity
function withdrawable(address account) external view returns (uint256 amount)
```

Calculates how much can be withdrawn for account at this time.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The account to calculate amount for |

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | Amount withdrawable (in wei) |



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### OwnershipTransferStarted

```solidity
event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### Staked

```solidity
event Staked(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

### StakingRewardDistributed

```solidity
event StakingRewardDistributed(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

### StakingRewardsClaimed

```solidity
event StakingRewardsClaimed(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Unstaked

```solidity
event Unstaked(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

### WithdrawalFinished

```solidity
event WithdrawalFinished(address indexed account, address indexed to, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| to `indexed` | address | undefined |
| amount  | uint256 | undefined |

### WithdrawalRegistered

```solidity
event WithdrawalRegistered(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |



## Errors

### FailedToBurnAmount

```solidity
error FailedToBurnAmount()
```






### InvalidMinStake

```solidity
error InvalidMinStake()
```






### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoRewards

```solidity
error NoRewards()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```






### StakeRequirement

```solidity
error StakeRequirement(string src, string msg)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| src | string | undefined |
| msg | string | undefined |

### WithdrawalFailed

```solidity
error WithdrawalFailed()
```







