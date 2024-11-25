# IMacroFactor









## Methods

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







