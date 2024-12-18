# IRSIndex









## Methods

### disableGuard

```solidity
function disableGuard() external nonpayable
```

Enables the RSI bonus and Macro factor updates again

*only governance can call this function*


### getRSIBonus

```solidity
function getRSIBonus() external view returns (uint256)
```

Get the rsi

*return the rsi*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | RSIndex |

### guardBonuses

```solidity
function guardBonuses() external nonpayable
```

Protects RSI bonus and Macro factor updates and set them to default values

*only governance can call this function*


### updatePrice

```solidity
function updatePrice(uint256 price, uint256 day) external nonpayable
```

Updates the price for the last day

*only the PriceOracle can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| price | uint256 | the price to be updated |
| day | uint256 | the day to be updated |



## Events

### PriceUpdated

```solidity
event PriceUpdated(uint256 day, uint256 price)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| day  | uint256 | undefined |
| price  | uint256 | undefined |

### RSIBonusSet

```solidity
event RSIBonusSet(uint256 rsiBonus)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| rsiBonus  | uint256 | undefined |



## Errors

### GuardAlreadyDisabled

```solidity
error GuardAlreadyDisabled()
```






### GuardAlreadyEnabled

```solidity
error GuardAlreadyEnabled()
```







