# IHydraDelegation









## Methods

### calculatePositionPenalty

```solidity
function calculatePositionPenalty(address validator, address delegator, uint256 amount) external view returns (uint256 penalty)
```

Calculates the penalty for the position.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to calculate penalty for |
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
function claimDelegatorReward(address validator) external nonpayable
```

Claims rewards for delegator for validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### claimPositionReward

```solidity
function claimPositionReward(address validator, address to, uint256 epochNumber, uint256 balanceChangeIndex) external nonpayable
```

Claims reward for the vest manager (delegator).



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to claim from |
| to | address | Address to transfer the reward to |
| epochNumber | uint256 | Epoch where the last claimable reward is distributed We need it because not all rewards are matured at the moment of claiming |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards |

### delegate

```solidity
function delegate(address validator) external payable
```

Delegates sent amount to validator and claims rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to delegate to |

### delegateWithVesting

```solidity
function delegateWithVesting(address validator, uint256 durationWeeks) external payable
```

Delegates sent amount to validator. Set vesting position data. Delete old pool params data, if exists. Can be used by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to delegate to |
| durationWeeks | uint256 | Duration of the vesting in weeks |

### delegationOf

```solidity
function delegationOf(address staker, address delegator) external view returns (uint256)
```

Return the amount of delegation for a delegator to a validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |
| delegator | address | Address of the delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### distributeDelegationRewards

```solidity
function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) external nonpayable
```

Distributes rewards to delegators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |
| reward | uint256 | Amount of rewards to distribute |
| epochId | uint256 | Epoch ID |

### getDelegationPoolParamsHistory

```solidity
function getDelegationPoolParamsHistory(address validator, address delegator) external view returns (struct DelegationPoolParams[])
```

Gets the delegation pool params history for a validator and delegator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator that is delegated to |
| delegator | address | Delegator that delegated |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | DelegationPoolParams[] | undefined |

### getDelegatorReward

```solidity
function getDelegatorReward(address validator, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards index (with custom APR params applied)



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards index per validator (in HYDRA wei) |

### getRPSValues

```solidity
function getRPSValues(address validator, uint256 startEpoch, uint256 endEpoch) external view returns (struct RPS[])
```

Gets the RPS values for a validator in a given epoch range.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator that is deleagted to |
| startEpoch | uint256 | Start epoch for values |
| endEpoch | uint256 | End epoch for values |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | RPS[] | undefined |

### getRawDelegatorReward

```solidity
function getRawDelegatorReward(address validator, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards index (without custom APR params applied)



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards index per validator (in HYDRA wei) |

### isActiveDelegatePosition

```solidity
function isActiveDelegatePosition(address validator, address delegator) external view returns (bool)
```

Returns true if the position is active.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator for the position |
| delegator | address | Delegator for the position |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isMaturingDelegatePosition

```solidity
function isMaturingDelegatePosition(address validator, address delegator) external view returns (bool)
```

Returns true if the position is maturing.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator for the position |
| delegator | address | Delegator for the position |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### liquidToken

```solidity
function liquidToken() external view returns (address)
```

Returns the address of the token that is distributed as a liquidity on stake




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

### setCommission

```solidity
function setCommission(uint256 newCommission) external nonpayable
```

Sets commission for validator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| newCommission | uint256 | New commission (100 = 100%) |

### stakerDelegationCommission

```solidity
function stakerDelegationCommission(address staker) external view returns (uint256)
```

Returns commission for validator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | commission Commission for validator |

### swapVestedPositionValidator

```solidity
function swapVestedPositionValidator(address oldValidator, address newValidator) external nonpayable
```

Move a vested position to another validator. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldValidator | address | Validator to swap from |
| newValidator | address | Validator to swap to |

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

### undelegate

```solidity
function undelegate(address validator, uint256 amount) external nonpayable
```

Undelegates amount from validator for sender and claims rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to undelegate from |
| amount | uint256 | The amount to undelegate |

### undelegateWithVesting

```solidity
function undelegateWithVesting(address validator, uint256 amount) external nonpayable
```

Undelegates amount from validator for vesting position. Apply penalty in case vesting is not finished. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to undelegate from |
| amount | uint256 | Amount to be undelegated |

### withdraw

```solidity
function withdraw(address to) external nonpayable
```

Withdraws sender&#39;s withdrawable amount to specified address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | Address to withdraw to |

### withdrawable

```solidity
function withdrawable(address account) external view returns (uint256)
```

Calculates how much can be withdrawn for account at this time.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The account to calculate amount for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Amount withdrawable (in wei) |



## Events

### CommissionUpdated

```solidity
event CommissionUpdated(address indexed validator, uint256 newCommission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| newCommission  | uint256 | undefined |

### Delegated

```solidity
event Delegated(address indexed validator, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### DelegatorRewardClaimed

```solidity
event DelegatorRewardClaimed(address indexed staker, address indexed delegator, uint256 amount)
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

### PositionCut

```solidity
event PositionCut(address indexed manager, address indexed validator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| validator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionOpened

```solidity
event PositionOpened(address indexed manager, address indexed validator, uint256 indexed weeksDuration, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| validator `indexed` | address | undefined |
| weeksDuration `indexed` | uint256 | undefined |
| amount  | uint256 | undefined |

### PositionRewardClaimed

```solidity
event PositionRewardClaimed(address indexed manager, address indexed validator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| validator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionSwapped

```solidity
event PositionSwapped(address indexed manager, address indexed oldValidator, address indexed newValidator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| oldValidator `indexed` | address | undefined |
| newValidator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Undelegated

```solidity
event Undelegated(address indexed validator, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
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

### InvalidCommission

```solidity
error InvalidCommission(uint256 commission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| commission | uint256 | undefined |

### InvalidMinDelegation

```solidity
error InvalidMinDelegation()
```






### InvalidStaker

```solidity
error InvalidStaker(address staker)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | undefined |

### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```







