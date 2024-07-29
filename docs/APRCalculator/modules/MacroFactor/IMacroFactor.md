# IMacroFactor









## Methods

### gardMacroFactor

```solidity
function gardMacroFactor() external nonpayable
```

Guard the macro factor, so it cannot be changed from price and put it to inital value, or if disabled, it anables it

*only governance can call this function in case of emergency or price manipulation*


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



## Events

### MacroFactorSet

```solidity
event MacroFactorSet(uint256 macroFactor)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| macroFactor  | uint256 | undefined |



