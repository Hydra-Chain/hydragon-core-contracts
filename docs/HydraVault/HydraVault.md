# HydraVault









## Methods

### initialize

```solidity
function initialize(address governer) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| governer | address | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### relocateFees

```solidity
function relocateFees(address contractAddress, bytes callData) external nonpayable
```

Generic method that will be used to transfer the generated fees to another contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| contractAddress | address | The address of the contract that will be called |
| callData | bytes | The encoded function with its signature and parameters, if any |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |



## Events

### FeeReceived

```solidity
event FeeReceived(address indexed from, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| amount  | uint256 | undefined |

### FeesRelocated

```solidity
event FeesRelocated(bool success, bytes data)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| success  | bool | undefined |
| data  | bytes | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



