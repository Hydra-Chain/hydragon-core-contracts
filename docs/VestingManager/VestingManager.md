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

### LIQUIDITY_TOKEN

```solidity
function LIQUIDITY_TOKEN() external view returns (contract IERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### claimVestedPositionReward

```solidity
function claimVestedPositionReward(address staker, uint256 epochNumber, uint256 balanceChangeIndex) external payable
```

Claims the vested position reward from HydraDelegation contract

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| epochNumber | uint256 | epoch number |
| balanceChangeIndex | uint256 | balance change index |

### cutVestedDelegatePosition

```solidity
function cutVestedDelegatePosition(address staker, uint256 amount) external payable
```

Cuts a vested delegate position and takes the liquid tokens from the position owner

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| amount | uint256 | amount to be cut |

### cutVestedDelegatePositionWithPermit

```solidity
function cutVestedDelegatePositionWithPermit(address staker, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable
```

Cuts a vested delegate position and takes the liquid tokens from the position owner

*The owner of the contract is the only one who can call this functionThe permit function is used to approve the transfer of the liquid tokens*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| amount | uint256 | amount to be cut |
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

Opens a new vested delegate position &amp; recive the liquid tokens

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| durationWeeks | uint256 | number of weeks for the vesting period |

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

Swaps the staker of a vested position

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| oldStaker | address | old staker address |
| newStaker | address | new staker address |

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

Withdraws available hydra from HydraDelegation contract

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | address to send hydra to |



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



