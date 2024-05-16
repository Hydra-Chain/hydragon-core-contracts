# IInspector









## Methods

### banValidator

```solidity
function banValidator(address validator) external nonpayable
```

Public method where anyone can execute to ban a validator

*This function will ban only if the input validator has reached the ban treshold*

#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### banValidatorByOwner

```solidity
function banValidatorByOwner(address validator) external nonpayable
```

Manually ban a validator by the owner



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### setBanThreshold

```solidity
function setBanThreshold(uint256 newThreshold) external nonpayable
```

Set the threshold that needs to be reached to ban a validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| newThreshold | uint256 | The new threshold in blocks |

### setReporterReward

```solidity
function setReporterReward(uint256 newReward) external nonpayable
```

Set the reward of the person who reports a validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| newReward | uint256 | Amount of the reward |

### setValidatorPenalty

```solidity
function setValidatorPenalty(uint256 newPenalty) external nonpayable
```

Set the penalty amount for the banned validators



#### Parameters

| Name | Type | Description |
|---|---|---|
| newPenalty | uint256 | Amount of the penalty |

### withdrawBannedFunds

```solidity
function withdrawBannedFunds() external nonpayable
```

Withdraw funds left for a banned validator

*Function can be executed only by the banned validator*




## Events

### ValidatorBanned

```solidity
event ValidatorBanned(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |



## Errors

### ThresholdNotReached

```solidity
error ThresholdNotReached()
```







