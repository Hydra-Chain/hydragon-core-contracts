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

### changeDefaultMacroFactor

```solidity
function changeDefaultMacroFactor(uint256 _macroFactor) external nonpayable
```

Change the default macro factor

*only governance can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _macroFactor | uint256 | The new default macro factor |

### disableGuard

```solidity
function disableGuard() external nonpayable
```

Enables the RSI bonus and Macro factor updates again

*only governance can call this function*


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

### getMacroFactor

```solidity
function getMacroFactor() external view returns (uint256)
```

Get the macro factor

*return the macro factor*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | macro factor |

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

Get the rsi

*return the rsi*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | RSIndex |

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

### guardBonuses

```solidity
function guardBonuses() external nonpayable
```

Protects RSI bonus and Macro factor updates and set them to default values

*only governance can call this function*


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

### DefaultMacroFactorChanged

```solidity
event DefaultMacroFactorChanged(uint256 macroFactor)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| macroFactor  | uint256 | undefined |

### MacroFactorSet

```solidity
event MacroFactorSet(uint256 macroFactor)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| macroFactor  | uint256 | undefined |

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
event RSIBonusSet(uint256 RSIndex)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| RSIndex  | uint256 | undefined |



## Errors

### GuardAlreadyDisabled

```solidity
error GuardAlreadyDisabled()
```






### GuardAlreadyEnabled

```solidity
error GuardAlreadyEnabled()
```






### InvalidMacroFactor

```solidity
error InvalidMacroFactor()
```






### InvalidRSI

```solidity
error InvalidRSI()
```






### PriceAlreadySet

```solidity
error PriceAlreadySet()
```







