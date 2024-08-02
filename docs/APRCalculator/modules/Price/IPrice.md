# IPrice









## Methods

### disableGuard

```solidity
function disableGuard() external nonpayable
```

anables the RSI bonus and Macro factor updates again

*only governance can call this function*


### guardBonuses

```solidity
function guardBonuses() external nonpayable
```

protects RSI bonus and Macro factor updates and set them to defult values

*only governance can call this function*


### quotePrice

```solidity
function quotePrice(uint256 price) external nonpayable
```

Quotes the price for each epoch &amp; keeps the average price for each day

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



## Errors

### InvalidPrice

```solidity
error InvalidPrice()
```






### PriceAlreadyQuoted

```solidity
error PriceAlreadyQuoted()
```







