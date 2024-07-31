# IAPRCalculator









## Methods

### applyBaseAPR

```solidity
function applyBaseAPR(uint256 amount) external view returns (uint256)
```

applies the base APR for the given amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | the amount to apply the APR to |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### applyMacro

```solidity
function applyMacro(uint256 totalStaked) external view returns (uint256 reward)
```

applies macro factor for the given total staked amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| totalStaked | uint256 | the total staked amount to apply the macro factor to |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | undefined |

### applyMaxReward

```solidity
function applyMaxReward(uint256 reward) external view returns (uint256)
```

applies the max reward for the given amount - 52 weeks



#### Parameters

| Name | Type | Description |
|---|---|---|
| reward | uint256 | the reward to apply the max reward to |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getBaseAPR

```solidity
function getBaseAPR() external view returns (uint256)
```

returns base APR




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getDENOMINATOR

```solidity
function getDENOMINATOR() external pure returns (uint256)
```

returns the denominator for the APR calculation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getEpochMaxReward

```solidity
function getEpochMaxReward(uint256 totalStaked) external view returns (uint256 reward)
```

returns the epoch max reward for the given total staked amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| totalStaked | uint256 | the total staked amount to apply the max epoch reward to |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | undefined |

### getEpochsPerYear

```solidity
function getEpochsPerYear() external pure returns (uint256)
```

returns the number of epochs per year




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getMaxAPR

```solidity
function getMaxAPR() external view returns (uint256 nominator, uint256 denominator)
```

returns the max APR for 52 weeks




#### Returns

| Name | Type | Description |
|---|---|---|
| nominator | uint256 | the nominator for the max APR |
| denominator | uint256 | the denominator for the max APR |

### getRSIBonus

```solidity
function getRSIBonus() external view returns (uint256)
```

returns max reward




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getVestingBonus

```solidity
function getVestingBonus(uint256 weeksCount) external view returns (uint256 nominator)
```

returns the vesting bonus for the given weeks count



#### Parameters

| Name | Type | Description |
|---|---|---|
| weeksCount | uint256 | the amount of weeks to calculate the bonus for |

#### Returns

| Name | Type | Description |
|---|---|---|
| nominator | uint256 | undefined |

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

### setBase

```solidity
function setBase(uint256 newBase) external nonpayable
```

sets new base APR

*only owner can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newBase | uint256 | new base APR |

### setMacro

```solidity
function setMacro(uint256 newMacroFactor) external nonpayable
```

sets new Macro factor

*only owner can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newMacroFactor | uint256 | new macro factor |

### setRSI

```solidity
function setRSI(uint256 newRSI) external nonpayable
```

sets new RSI value

*only owner can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newRSI | uint256 | new RSI value |



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

### InvalidMacro

```solidity
error InvalidMacro()
```






### InvalidPrice

```solidity
error InvalidPrice()
```






### InvalidRSI

```solidity
error InvalidRSI()
```






### PriceAlreadyQuoted

```solidity
error PriceAlreadyQuoted()
```







