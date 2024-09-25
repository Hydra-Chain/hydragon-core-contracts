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

### getMacroFactor

```solidity
function getMacroFactor() external view returns (uint256)
```

Get the macro factor˘

*return the macro factor*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | macro factor |



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



## Errors

### InvalidMacroFactor

```solidity
error InvalidMacroFactor()
```







