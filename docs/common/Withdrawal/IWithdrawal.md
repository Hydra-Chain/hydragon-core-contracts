# IWithdrawal









## Methods

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

### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```







