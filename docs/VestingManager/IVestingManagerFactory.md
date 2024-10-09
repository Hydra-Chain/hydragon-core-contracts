# IVestingManagerFactory









## Methods

### getUserVestingManagers

```solidity
function getUserVestingManagers(address user) external view returns (address[])
```

Gets user vesting managers.

*Gets the vesting managers per user address for fast off-chain lookup.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | User address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |

### isVestingManager

```solidity
function isVestingManager(address account) external view returns (bool)
```

Claims that a delegator is a vest manager or not.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Delegator&#39;s address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### newVestingManager

```solidity
function newVestingManager() external nonpayable
```

Creates new vesting manager which owner is the caller. Every new instance is proxy leading to base impl, so minimal fees are applied. Only Vesting manager can use the vesting functionality, so users need to create a manager first to be able to vest.







## Errors

### InvalidOwner

```solidity
error InvalidOwner()
```







