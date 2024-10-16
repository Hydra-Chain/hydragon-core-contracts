# IInspector









## Methods

### banValidator

```solidity
function banValidator(address validator) external nonpayable
```

Method used to ban a validator, if the ban threshold is reached

*This function will validate the threshold only if the executor is not the governance, otherwise will forcely ban the validator*

#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### initiateBan

```solidity
function initiateBan(address validator) external nonpayable
```

Method used to initiate a ban for validator, if the initiate ban threshold is reached



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### setBanThreshold

```solidity
function setBanThreshold(uint256 newThreshold) external nonpayable
```

Set the threshold that needs to be reached to finish the ban procedure (in milliseconds)



#### Parameters

| Name | Type | Description |
|---|---|---|
| newThreshold | uint256 | The new threshold in blocks |

### setInitiateBanThreshold

```solidity
function setInitiateBanThreshold(uint256 newThreshold) external nonpayable
```

Set the threshold that needs to be reached to initiate the ban procedure (in blocks)



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

### terminateBanProcedure

```solidity
function terminateBanProcedure() external nonpayable
```

Method used to terminate the ban procedure






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

### BanAlreadyInitiated

```solidity
error BanAlreadyInitiated()
```






### NoBanInititated

```solidity
error NoBanInititated()
```






### NoBanSubject

```solidity
error NoBanSubject()
```






### NoInitiateBanSubject

```solidity
error NoInitiateBanSubject()
```







