# IInspector









## Methods

### banValidator

```solidity
function banValidator(address validator) external nonpayable
```

Manual ban of a validator

*Function can be executed only by the governor/owner*

#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

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



