# Vesting



> VestedStaking

An extension of the Staking contract that enables vesting the stake for a higher APY



## Methods

### DENOMINATOR

```solidity
function DENOMINATOR() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### aprCalculatorContract

```solidity
function aprCalculatorContract() external view returns (contract IAPRCalculator)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IAPRCalculator | undefined |

### penaltyDecreasePerWeek

```solidity
function penaltyDecreasePerWeek() external view returns (uint256)
```

The penalty decrease per week




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### vestingLiquidityDecreasePerWeek

```solidity
function vestingLiquidityDecreasePerWeek() external view returns (uint256)
```

A fraction&#39;s numerator representing the rate at which the liquidity tokens&#39; distribution is decreased on a weekly basis




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |



## Errors

### FailedToBurnAmount

```solidity
error FailedToBurnAmount()
```







