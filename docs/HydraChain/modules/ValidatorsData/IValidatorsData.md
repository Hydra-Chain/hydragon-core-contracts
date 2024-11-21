# IValidatorsData









## Methods

### getTotalVotingPower

```solidity
function getTotalVotingPower() external view returns (uint256)
```

Returns the total voting power of the validators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint256 Total voting power of the validators |

### getValidatorPower

```solidity
function getValidatorPower(address validator) external view returns (uint256)
```

Returns the voting power of the validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint256 Voting power of the validator |

### syncValidatorsData

```solidity
function syncValidatorsData(ValidatorPower[] validatorsPower) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validatorsPower | ValidatorPower[] | undefined |



## Events

### ValidatorsDataSynced

```solidity
event ValidatorsDataSynced(ValidatorPower[] validatorsPower)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validatorsPower  | ValidatorPower[] | undefined |



