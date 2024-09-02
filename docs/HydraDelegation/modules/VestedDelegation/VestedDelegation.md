# VestedDelegation









## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### MIN_DELEGATION_LIMIT

```solidity
function MIN_DELEGATION_LIMIT() external view returns (uint256)
```

A constant for the minimum delegation limit




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

### balanceChangeThreshold

```solidity
function balanceChangeThreshold() external view returns (uint256)
```

The threshold for the maximum number of allowed balance changes

*We are using this to restrict unlimited changes of the balance (delegationPoolParamsHistory)*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calculateExpectedPositionReward

```solidity
function calculateExpectedPositionReward(address staker, address delegator, uint256 epochNumber, uint256 balanceChangeIndex) external view returns (uint256 reward)
```

Calculates the delegators&#39;s generated rewards that are unclaimed



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |
| epochNumber | uint256 | Epoch where the last claimable reward is distributed We need it because not all rewards are matured at the moment of claiming |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | Unclaimed rewards expected by the delegator from a staker (in HYDRA wei) |

### calculatePositionPenalty

```solidity
function calculatePositionPenalty(address staker, address delegator, uint256 amount) external view returns (uint256 penalty)
```

Calculates the penalty for the position.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to calculate penalty for |
| delegator | address | Delegator to calculate penalty for |
| amount | uint256 | Amount to calculate penalty for |

#### Returns

| Name | Type | Description |
|---|---|---|
| penalty | uint256 | undefined |

### changeMinDelegation

```solidity
function changeMinDelegation(uint256 newMinDelegation) external nonpayable
```

Changes the minimum delegation amount

*Only callable by the admin*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newMinDelegation | uint256 | New minimum delegation amount |

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

### claimDelegatorReward

```solidity
function claimDelegatorReward(address staker) external nonpayable
```

Claims rewards for delegator for staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

### claimPositionReward

```solidity
function claimPositionReward(address staker, address to, uint256 epochNumber, uint256 balanceChangeIndex) external nonpayable
```

Claims reward for the vest manager (delegator).



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to claim from |
| to | address | Address to transfer the reward to |
| epochNumber | uint256 | Epoch where the last claimable reward is distributed We need it because not all rewards are matured at the moment of claiming |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards |

### delegate

```solidity
function delegate(address staker) external payable
```

Delegates sent amount to staker and claims rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |

### delegateWithVesting

```solidity
function delegateWithVesting(address staker, uint256 durationWeeks) external payable
```

Delegates sent amount to staker. Set vesting position data. Delete old pool params data, if exists. Can be used by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |
| durationWeeks | uint256 | Duration of the vesting in weeks |

### delegationOf

```solidity
function delegationOf(address staker, address delegator) external view returns (uint256)
```

Return the amount of delegation for a delegator to a staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |
| delegator | address | Address of the delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### delegationPoolParamsHistory

```solidity
function delegationPoolParamsHistory(address, address, uint256) external view returns (uint256 balance, int256 correction, uint256 epochNum)
```

Historical Staker Delegation Pool&#39;s Params per delegator

*Staker =&gt; Delegator =&gt; Pool params data*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |
| _2 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| balance | uint256 | undefined |
| correction | int256 | undefined |
| epochNum | uint256 | undefined |

### delegationPools

```solidity
function delegationPools(address) external view returns (uint256 supply, uint256 virtualSupply, uint256 magnifiedRewardPerShare)
```

Keeps the delegation pools



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| supply | uint256 | undefined |
| virtualSupply | uint256 | undefined |
| magnifiedRewardPerShare | uint256 | undefined |

### getDelegationPoolParamsHistory

```solidity
function getDelegationPoolParamsHistory(address staker, address delegator) external view returns (struct DelegationPoolParams[])
```

Gets the delegation pool params history for a staker and delegator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator that is delegated to |
| delegator | address | Delegator that delegated |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | DelegationPoolParams[] | undefined |

### getDelegatorPositionReward

```solidity
function getDelegatorPositionReward(address staker, address delegator, uint256 epochNumber, uint256 balanceChangeIndex) external view returns (uint256 reward)
```

Gets delegators&#39;s matured unclaimed rewards for a position



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |
| epochNumber | uint256 | Epoch where the last claimable reward is distributed We need it because not all rewards are matured at the moment of claiming |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | Delegator&#39;s unclaimed rewards with staker (in HYDRA wei) |

### getDelegatorReward

```solidity
function getDelegatorReward(address staker, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards (with custom APR params applied)



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards per staker (in HYDRA wei) |

### getRPSValues

```solidity
function getRPSValues(address staker, uint256 startEpoch, uint256 endEpoch) external view returns (struct RPS[])
```

Gets the RPS values for a staker in a given epoch range.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator that is deleagted to |
| startEpoch | uint256 | Start epoch for values |
| endEpoch | uint256 | End epoch for values |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | RPS[] | undefined |

### getRawDelegatorReward

```solidity
function getRawDelegatorReward(address staker, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards (without custom APR params applied)



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards per staker (in HYDRA wei) |

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

### historyRPS

```solidity
function historyRPS(address, uint256) external view returns (uint192 value, uint64 timestamp)
```

Keeps the history of the RPS for the stakers

*This is used to keep the history RPS in order to calculate properly the rewards*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| value | uint192 | undefined |
| timestamp | uint64 | undefined |

### hydraChainContract

```solidity
function hydraChainContract() external view returns (contract IHydraChain)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHydraChain | undefined |

### hydraStakingContract

```solidity
function hydraStakingContract() external view returns (contract IHydraStaking)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHydraStaking | undefined |

### isActiveDelegatePosition

```solidity
function isActiveDelegatePosition(address staker, address delegator) external view returns (bool)
```

Returns true if the position is active.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator for the position |
| delegator | address | Delegator for the position |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isBalanceChangeMade

```solidity
function isBalanceChangeMade(address staker, address delegator, uint256 currentEpochNum) external view returns (bool)
```

Checks if balance change was already made in the current epoch



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |
| delegator | address | Delegator that has delegated |
| currentEpochNum | uint256 | Current epoch number |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isBalanceChangeThresholdExceeded

```solidity
function isBalanceChangeThresholdExceeded(address staker, address delegator) external view returns (bool)
```

Checks if the balance changes exceeds the threshold



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |
| delegator | address | Delegator that has delegated |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isMaturingDelegatePosition

```solidity
function isMaturingDelegatePosition(address staker, address delegator) external view returns (bool)
```

Returns true if the position is maturing.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator for the position |
| delegator | address | Delegator for the position |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isPositionAvailableForSwap

```solidity
function isPositionAvailableForSwap(address newStaker, address delegator) external view returns (bool)
```

Check if the new position that the user wants to swap to is available for the swap

*Available positions one that is not active, not maturing and doesn&#39;t have any left balance or rewards*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newStaker | address | The address of the new validator |
| delegator | address | The address of the delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### minDelegation

```solidity
function minDelegation() external view returns (uint256)
```

The minimum delegation amount to be delegated




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

### swapVestedPositionStaker

```solidity
function swapVestedPositionStaker(address oldStaker, address newStaker) external nonpayable
```

Move a vested position to another staker. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldStaker | address | Validator to swap from |
| newStaker | address | Validator to swap to |

### totalDelegation

```solidity
function totalDelegation() external view returns (uint256)
```

Returns the total delegation amount




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalDelegationOf

```solidity
function totalDelegationOf(address staker) external view returns (uint256)
```

Returns the total amount of delegation for a staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

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

### undelegate

```solidity
function undelegate(address staker, uint256 amount) external nonpayable
```

Undelegates amount from staker for sender and claims rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to undelegate from |
| amount | uint256 | The amount to undelegate |

### undelegateWithVesting

```solidity
function undelegateWithVesting(address staker, uint256 amount) external nonpayable
```

Undelegates amount from staker for vesting position. Apply penalty in case vesting is not finished. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to undelegate from |
| amount | uint256 | Amount to be undelegated |

### vestedDelegationPositions

```solidity
function vestedDelegationPositions(address, address) external view returns (uint256 duration, uint256 start, uint256 end, uint256 base, uint256 vestBonus, uint256 rsiBonus)
```

The vesting positions for every delegator

*Staker =&gt; Delegator =&gt; VestingPosition*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| duration | uint256 | undefined |
| start | uint256 | undefined |
| end | uint256 | undefined |
| base | uint256 | undefined |
| vestBonus | uint256 | undefined |
| rsiBonus | uint256 | undefined |

### vestingManagerFactoryContract

```solidity
function vestingManagerFactoryContract() external view returns (contract IVestingManagerFactory)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IVestingManagerFactory | undefined |

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

### Delegated

```solidity
event Delegated(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### DelegatorRewardDistributed

```solidity
event DelegatorRewardDistributed(address indexed staker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| amount  | uint256 | undefined |

### DelegatorRewardsClaimed

```solidity
event DelegatorRewardsClaimed(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

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

### PositionCut

```solidity
event PositionCut(address indexed manager, address indexed staker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| staker `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionOpened

```solidity
event PositionOpened(address indexed manager, address indexed staker, uint256 indexed weeksDuration, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| staker `indexed` | address | undefined |
| weeksDuration `indexed` | uint256 | undefined |
| amount  | uint256 | undefined |

### PositionRewardClaimed

```solidity
event PositionRewardClaimed(address indexed manager, address indexed staker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| staker `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionSwapped

```solidity
event PositionSwapped(address indexed manager, address indexed oldStaker, address indexed newStaker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| oldStaker `indexed` | address | undefined |
| newStaker `indexed` | address | undefined |
| amount  | uint256 | undefined |

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

### Undelegated

```solidity
event Undelegated(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
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

### DelegateRequirement

```solidity
error DelegateRequirement(string src, string msg)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| src | string | undefined |
| msg | string | undefined |

### InvalidMinDelegation

```solidity
error InvalidMinDelegation()
```






### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```






### NotVestingManager

```solidity
error NotVestingManager()
```






### WithdrawalFailed

```solidity
error WithdrawalFailed()
```







