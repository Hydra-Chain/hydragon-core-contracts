# IDelegation









## Methods

### applyPendingCommission

```solidity
function applyPendingCommission() external nonpayable
```

Applies pending commission for staker.

*Anyone can apply commission, but if the caller is not active validator, it will not have any effect.*


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

### claimCommission

```solidity
function claimCommission(address to) external nonpayable
```

Claims commission for staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | Address to send the commission to |

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

### lockCommissionReward

```solidity
function lockCommissionReward(address staker) external nonpayable
```

Locks the commission for the staker

*Only callable by HydraChain*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

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

### setInitialCommission

```solidity
function setInitialCommission(uint256 initialCommission) external nonpayable
```

Sets initial commission for staker.

*the staker needs to have 0 commission and have never used pending commission*

#### Parameters

| Name | Type | Description |
|---|---|---|
| initialCommission | uint256 | Initial commission (100 = 100%) |

### setPendingCommission

```solidity
function setPendingCommission(uint256 newCommission) external nonpayable
```

Sets pending commission for staker.

*The pending commission can be applied by after 30 days.The pending commission can be overridden any time, but the 30 days period will be reset.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newCommission | uint256 | New commission (100 = 100%) |

### stakerDelegationCommission

```solidity
function stakerDelegationCommission(address staker) external view returns (uint256)
```

Returns commission for staker.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | commission Commission for staker |

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

### unlockCommissionReward

```solidity
function unlockCommissionReward(address staker) external nonpayable
```

Unlocks the commission for the staker

*Only callable by HydraChain*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

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
event CommissionClaimed(address indexed staker, address indexed to, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| to `indexed` | address | undefined |
| amount  | uint256 | undefined |

### CommissionDistributed

```solidity
event CommissionDistributed(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### CommissionUpdated

```solidity
event CommissionUpdated(address indexed staker, uint256 newCommission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| newCommission  | uint256 | undefined |

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

### PendingCommissionAdded

```solidity
event PendingCommissionAdded(address indexed staker, uint256 newCommission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| newCommission  | uint256 | undefined |

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

### CommissionRewardLocked

```solidity
error CommissionRewardLocked()
```






### CommissionUpdateNotAvailable

```solidity
error CommissionUpdateNotAvailable()
```






### InitialCommissionAlreadySet

```solidity
error InitialCommissionAlreadySet()
```






### InvalidCommission

```solidity
error InvalidCommission()
```






### InvalidMinDelegation

```solidity
error InvalidMinDelegation()
```






### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoCommissionToClaim

```solidity
error NoCommissionToClaim()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```






### WithdrawalFailed

```solidity
error WithdrawalFailed()
```







