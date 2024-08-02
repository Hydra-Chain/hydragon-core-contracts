# IRSIndex









## Methods

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

### guardRSIndex

```solidity
function guardRSIndex() external nonpayable
```

Guard the RSI, so it cannot be changed from price and put it to inital value, or if disabled, it anables it

*only governance can call this function in case of emergency or price manipulation*




## Events

### RSIBonusSet

```solidity
event RSIBonusSet(uint256 RSIndex)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| RSIndex  | uint256 | undefined |



