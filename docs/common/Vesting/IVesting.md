# IVesting









## Methods

### setPenaltyDecreasePerWeek

```solidity
function setPenaltyDecreasePerWeek(uint256 newRate) external nonpayable
```

sets a new penalty rate

*Only callable by the adminthe rate should be between 10 and 150 (0.1% and 1.5%)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newRate | uint256 | the new penalty rate |




## Errors

### FailedToBurnAmount

```solidity
error FailedToBurnAmount()
```






### PenaltyRateOutOfRange

```solidity
error PenaltyRateOutOfRange()
```







