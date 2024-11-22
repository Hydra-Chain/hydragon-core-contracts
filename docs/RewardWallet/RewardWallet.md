# RewardWallet



> RewardWallet



*This contract will be responsible for the rewards that will be distributed to stakers. It will be fulfilled with enough funds in order to be able to always have enough liquidity.*

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

### distributeReward

```solidity
function distributeReward(address to, uint256 amount) external nonpayable
```

Distribute the specified `amount` of coins to the given address.

*Can only be called by a manager address, e.g., HydraStaking or HydraChain contracts.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | The address to receive the coins. |
| amount | uint256 | The amount of coins to send. |

### fund

```solidity
function fund() external payable
```

Method used to fund the contract with HYDRA.

*This function is used to prevent modifications to the node&#39;s logic for systems transactions, which currently require an input. Since the `receive` function cannot be taken as an input there, we have decided to create this new function.*


### initialize

```solidity
function initialize(address[] managers) external nonpayable
```

Initializes the reward wallet with the provided addresses that will be able to distribute rewards

*The provided addresses will be other genesis contracts like the HydraStaking and HydraDelegation*

#### Parameters

| Name | Type | Description |
|---|---|---|
| managers | address[] | The list of manager addresses. |

### rewardManagers

```solidity
function rewardManagers(address) external view returns (bool)
```

The mapping of the managers



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### Received

```solidity
event Received(address indexed from, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| amount  | uint256 | undefined |

### RewardDistributed

```solidity
event RewardDistributed(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |



## Errors

### DistributionFailed

```solidity
error DistributionFailed()
```






### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |


