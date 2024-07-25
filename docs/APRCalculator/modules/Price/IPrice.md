# IPrice









## Methods

### quotePrice

```solidity
function quotePrice(uint256 price) external nonpayable
```

quotes the price for the given epoch &amp; update price when the time is right

*only the system can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| price | uint256 | the amount to quote |



## Events

### PriceQuoted

```solidity
event PriceQuoted(uint256 indexed epochId, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| epochId `indexed` | uint256 | undefined |
| amount  | uint256 | undefined |

### PriceUpdated

```solidity
event PriceUpdated(uint256 time, uint256 price)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| time  | uint256 | undefined |
| price  | uint256 | undefined |



