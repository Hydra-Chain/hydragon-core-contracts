# VestingManager









## Methods

### HYDRA_DELEGATION

```solidity
function HYDRA_DELEGATION() external view returns (contract IHydraDelegation)
```

The hydra delegation contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHydraDelegation | undefined |

### claimVestedPositionReward

```solidity
function claimVestedPositionReward(address staker, uint256 epochNumber, uint256 balanceChangeIndex) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | undefined |
| epochNumber | uint256 | undefined |
| balanceChangeIndex | uint256 | undefined |

### cutVestedDelegatePosition

```solidity
function cutVestedDelegatePosition(address staker, uint256 amount) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | undefined |
| amount | uint256 | undefined |

### cutVestedDelegatePositionWithPermit

```solidity
function cutVestedDelegatePositionWithPermit(address staker, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | undefined |
| amount | uint256 | undefined |
| deadline | uint256 | undefined |
| v | uint8 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |

### initialize

```solidity
function initialize(address owner) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |

### openVestedDelegatePosition

```solidity
function openVestedDelegatePosition(address staker, uint256 durationWeeks) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | undefined |
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


### swapVestedPositionStaker

```solidity
function swapVestedPositionStaker(address oldStaker, address newStaker) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldStaker | address | undefined |
| newStaker | address | undefined |

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



