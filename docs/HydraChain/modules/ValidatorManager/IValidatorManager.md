# IValidatorManager









## Methods

### activateValidator

```solidity
function activateValidator(address account) external nonpayable
```

Activates validator.

*Can be called only by the staking contract.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Address of the validator |

### deactivateValidator

```solidity
function deactivateValidator(address account) external nonpayable
```

Deactivates validator.

*Can be called only by the staking contract.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Address of the validator |

### getActiveValidatorsCount

```solidity
function getActiveValidatorsCount() external view returns (uint256)
```

Gets the number of current validators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Returns the count as uint256 |

### getValidator

```solidity
function getValidator(address validator) external view returns (uint256[4] blsKey, uint256 stake, uint256 totalStake, uint256 commission, uint256 withdrawableRewards, bool active)
```

Gets validator by address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| blsKey | uint256[4] | BLS public key |
| stake | uint256 | self-stake |
| totalStake | uint256 | self-stake + delegation |
| commission | uint256 | commission |
| withdrawableRewards | uint256 | withdrawable rewards |
| active | bool | activity status |

### getValidators

```solidity
function getValidators() external view returns (address[])
```

Gets all validators. Returns already unactive validators as well.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | Returns array of addresses |

### isValidatorActive

```solidity
function isValidatorActive(address validator) external view returns (bool)
```

Retruns bool indicating if validator is Active.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isValidatorBanned

```solidity
function isValidatorBanned(address validator) external view returns (bool)
```

Retruns bool indicating if validator Banned.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isValidatorRegistered

```solidity
function isValidatorRegistered(address validator) external view returns (bool)
```

Retruns bool indicating if validator status is Registered.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### register

```solidity
function register(uint256[2] signature, uint256[4] pubkey) external nonpayable
```

Validates BLS signature with the provided pubkey and registers validators into the set.

*Validator must be whitelisted.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| signature | uint256[2] | Signature to validate message against |
| pubkey | uint256[4] | BLS public key of validator |

### updateExponent

```solidity
function updateExponent(uint256 newValue) external nonpayable
```

Sets new Voting Power Exponent Numerator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New Voting Power Exponent Numerator |



## Events

### NewValidator

```solidity
event NewValidator(address indexed validator, uint256[4] blsKey)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| blsKey  | uint256[4] | undefined |

### PowerExponentUpdated

```solidity
event PowerExponentUpdated(uint256 newPowerExponent)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newPowerExponent  | uint256 | undefined |



## Errors

### InvalidCommission

```solidity
error InvalidCommission(uint256 commission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| commission | uint256 | undefined |

### InvalidSignature

```solidity
error InvalidSignature(address signer)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signer | address | undefined |

### MaxValidatorsReached

```solidity
error MaxValidatorsReached()
```







