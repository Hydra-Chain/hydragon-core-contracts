# PowerExponent









## Methods

### acceptOwnership

```solidity
function acceptOwnership() external nonpayable
```



*The new owner accepts the ownership transfer.*


### getExponent

```solidity
function getExponent() external view returns (uint256 numerator, uint256 denominator)
```

Return the Voting Power Exponent Numerator and Denominator




#### Returns

| Name | Type | Description |
|---|---|---|
| numerator | uint256 | undefined |
| denominator | uint256 | undefined |

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

### powerExponent

```solidity
function powerExponent() external view returns (uint128 value, uint128 pendingValue)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| value | uint128 | undefined |
| pendingValue | uint128 | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one. Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### updateExponent

```solidity
function updateExponent(uint256 newValue) external nonpayable
```

Set new pending exponent, to be activated in the next commit epoch



#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New Voting Power Exponent Numerator |



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



