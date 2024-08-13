# PriceOracle



> PriceOracle



*This contract will be responsible for the price updates. Active validators will be able to vote and agree on the price.*

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

### aprCalculatorContract

```solidity
function aprCalculatorContract() external view returns (contract IAPRCalculator)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IAPRCalculator | undefined |

### getTodayIfVoteAvailable

```solidity
function getTodayIfVoteAvailable(uint256 _price) external view returns (uint256 day)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _price | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| day | uint256 | undefined |

### hydraChainContract

```solidity
function hydraChainContract() external view returns (contract IHydraChain)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHydraChain | undefined |

### initialize

```solidity
function initialize(address _hydraChainAddr, address _aprCalculatorAddr) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _hydraChainAddr | address | undefined |
| _aprCalculatorAddr | address | undefined |

### pricePerDay

```solidity
function pricePerDay(uint256) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### priceVotesForDay

```solidity
function priceVotesForDay(uint256, uint256) external view returns (uint256 price, address validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| price | uint256 | undefined |
| validator | address | undefined |

### validatorLastVotedDay

```solidity
function validatorLastVotedDay(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### vote

```solidity
function vote(uint256 _price) external nonpayable
```

Allows active validators to vote on the price

*it automatically updates the price if all conditions are met*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _price | uint256 | Price to vote |



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### PriceUpdateFailed

```solidity
event PriceUpdateFailed(uint256 price, uint256 day, bytes data)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| price  | uint256 | undefined |
| day  | uint256 | undefined |
| data  | bytes | undefined |

### PriceUpdated

```solidity
event PriceUpdated(uint256 price, uint256 day)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| price  | uint256 | undefined |
| day  | uint256 | undefined |

### PriceVoted

```solidity
event PriceVoted(uint256 price, address validator, uint256 day)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| price  | uint256 | undefined |
| validator  | address | undefined |
| day  | uint256 | undefined |



## Errors

### AlreadyVoted

```solidity
error AlreadyVoted()
```






### InvalidPrice

```solidity
error InvalidPrice()
```






### PriceAlreadySet

```solidity
error PriceAlreadySet()
```






### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |


