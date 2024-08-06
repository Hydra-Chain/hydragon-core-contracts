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

### priceVotesForDay

```solidity
function priceVotesForDay(uint256, uint256) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### validatorVotedForDay

```solidity
function validatorVotedForDay(address) external view returns (uint256)
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





#### Parameters

| Name | Type | Description |
|---|---|---|
| _price | uint256 | undefined |



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |



## Errors

### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |


