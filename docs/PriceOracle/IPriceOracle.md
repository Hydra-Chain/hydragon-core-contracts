# IPriceOracle









## Methods

### getGroupVotesForDay

```solidity
function getGroupVotesForDay(uint256 day) external view returns (struct PriceGroup[])
```

Returns the group of validators and their prices they agreed on for the provided day



#### Parameters

| Name | Type | Description |
|---|---|---|
| day | uint256 | The day to get the votes |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | PriceGroup[] | PriceGroup[] The group of validators and their agreed prices |

### getTotalVotedValidators

```solidity
function getTotalVotedValidators(uint256 day) external view returns (uint256)
```

Returns the total validators count that voted for the provided day



#### Parameters

| Name | Type | Description |
|---|---|---|
| day | uint256 | The day to validators count |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint256 The total validators count |

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


