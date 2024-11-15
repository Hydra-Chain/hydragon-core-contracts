# VestingManagerFactory









## Methods

### NATIVE_TOKEN_CONTRACT

```solidity
function NATIVE_TOKEN_CONTRACT() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### NATIVE_TRANSFER_PRECOMPILE

```solidity
function NATIVE_TRANSFER_PRECOMPILE() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### NATIVE_TRANSFER_PRECOMPILE_GAS

```solidity
function NATIVE_TRANSFER_PRECOMPILE_GAS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### SYSTEM

```solidity
function SYSTEM() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### VALIDATOR_PKCHECK_PRECOMPILE

```solidity
function VALIDATOR_PKCHECK_PRECOMPILE() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### VALIDATOR_PKCHECK_PRECOMPILE_GAS

```solidity
function VALIDATOR_PKCHECK_PRECOMPILE_GAS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### beacon

```solidity
function beacon() external view returns (contract UpgradeableBeacon)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract UpgradeableBeacon | undefined |

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

### initialize

```solidity
function initialize(address hydraDelegationAddr, address liquidityTokenAddr) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| hydraDelegationAddr | address | undefined |
| liquidityTokenAddr | address | undefined |

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

Creates new vesting manager which owner is the caller. Every new instance is proxy leading to base impl, so minimal fees are applied. Only Vesting manager can use the vesting functionality, So users need to create a manager first to be able to vest.




### userVestingManagers

```solidity
function userVestingManagers(address, uint256) external view returns (address)
```

Additional mapping to store all vesting managers per user address for fast off-chain lookup



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### vestingManagerOwner

```solidity
function vestingManagerOwner(address) external view returns (address)
```

A vesting manager pointing to its owner



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### NewVestingManager

```solidity
event NewVestingManager(address indexed owner, address newClone)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| newClone  | address | undefined |



## Errors

### InvalidOwner

```solidity
error InvalidOwner()
```






### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |


