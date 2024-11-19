# PriceOracle



> PriceOracle



*This contract will be responsible for the price updates. Active validators will be able to vote and agree on the price.*

## Methods

### DAILY_VOTING_END_TIME

```solidity
function DAILY_VOTING_END_TIME() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### DAILY_VOTING_START_TIME

```solidity
function DAILY_VOTING_START_TIME() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MAX_UINT224

```solidity
function MAX_UINT224() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### VOTING_POWER_PERCENTAGE_NEEDED

```solidity
function VOTING_POWER_PERCENTAGE_NEEDED() external view returns (uint256)
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

### getNumberOfValidatorsVotedForDay

```solidity
function getNumberOfValidatorsVotedForDay(uint256 day) external view returns (uint256)
```

Returns number of validators voted for the provided day



#### Parameters

| Name | Type | Description |
|---|---|---|
| day | uint256 | The day to get the number |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint256 The total number of validators voted |

### getVotesForDay

```solidity
function getVotesForDay(uint256 day) external view returns (struct ValidatorPrice[])
```

Returns the votes for the provided day



#### Parameters

| Name | Type | Description |
|---|---|---|
| day | uint256 | The day to get the votes |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | ValidatorPrice[] | ValidatorPrice[] The votes for the provided day |

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
function priceVotesForDay(uint256) external view returns (address head, uint256 size)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| head | address | undefined |
| size | uint256 | undefined |

### shouldVote

```solidity
function shouldVote(uint256 day) external view returns (bool, string)
```

Returns true if the validator can vote for the provided day



#### Parameters

| Name | Type | Description |
|---|---|---|
| day | uint256 | The day to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | true if the validator can vote |
| _1 | string | error message if the validator cannot vote |

### vote

```solidity
function vote(uint256 price) external nonpayable
```

Allows active validators to vote on the price

*it automatically updates the price if all conditions are met*

#### Parameters

| Name | Type | Description |
|---|---|---|
| price | uint256 | Price to vote |



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

### InvalidPrice

```solidity
error InvalidPrice()
```






### InvalidVote

```solidity
error InvalidVote(string message)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| message | string | undefined |

### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |


