# IDelegation









## Methods

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

Claims rewards for delegator and commissions for staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

### delegate

```solidity
function delegate(address staker) external payable
```

Delegates sent amount to staker, claims rewards and validator comission.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |

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

### getDelegatorReward

```solidity
function getDelegatorReward(address staker, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards (with custom APR params)



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards per staker (in HYDRA wei) |

### getRawDelegatorReward

```solidity
function getRawDelegatorReward(address staker, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards (without custom APR params)



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards per staker (in HYDRA wei) |

### getRawReward

```solidity
function getRawReward(address staker, address delegator) external view returns (uint256)
```

Returns the raw reward before applying the commission and APR



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |
| delegator | address | Address of the delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Raw reward for the delegator before applying APR and commission |

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
function undelegate(address staker, uint256 amount) external nonpayable
```

Undelegates amount from staker for sender, claims rewards and validator comission.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to undelegate from |
| amount | uint256 | The amount to undelegate |

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

### CommissionClaimed

```solidity
event CommissionClaimed(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

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






### WithdrawalFailed

```solidity
error WithdrawalFailed()
```







