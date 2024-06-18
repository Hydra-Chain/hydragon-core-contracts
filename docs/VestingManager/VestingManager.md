# VestingManager









## Methods

### claimVestedPositionReward

```solidity
function claimVestedPositionReward(address validator, uint256 epochNumber, uint256 balanceChangeIndex) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | undefined |
| epochNumber | uint256 | undefined |
| balanceChangeIndex | uint256 | undefined |

### cutVestedDelegatePosition

```solidity
function cutVestedDelegatePosition(address validator, uint256 amount) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | undefined |
| amount | uint256 | undefined |

### cutVestedDelegatePositionWithPermit

```solidity
function cutVestedDelegatePositionWithPermit(address validator, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | undefined |
| amount | uint256 | undefined |
| deadline | uint256 | undefined |
| v | uint8 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |

### delegation

```solidity
function delegation() external view returns (address)
```

The staking address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### initialize

```solidity
function initialize(address owner, address _rewardPool) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| _rewardPool | address | undefined |

### openVestedDelegatePosition

```solidity
function openVestedDelegatePosition(address validator, uint256 durationWeeks) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | undefined |
| durationWeeks | uint256 | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### rewardPool

```solidity
function rewardPool() external view returns (address)
```

The reward pool address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### swapVestedPositionValidator

```solidity
function swapVestedPositionValidator(address oldValidator, address newValidator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldValidator | address | undefined |
| newValidator | address | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### withdraw

```solidity
function withdraw(address to) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |



## Events

### Claimed

```solidity
event Claimed(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

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



