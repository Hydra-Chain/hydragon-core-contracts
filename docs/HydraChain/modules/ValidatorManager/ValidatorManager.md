# ValidatorManager









## Methods

### DOMAIN

```solidity
function DOMAIN() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### MAX_VALIDATORS

```solidity
function MAX_VALIDATORS() external view returns (uint256)
```

A constant for the maximum amount of validators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### NATIVE_TOKEN_CONTRACT

```solidity
function NATIVE_TOKEN_CONTRACT() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### NATIVE_TRANSFER_PRECOMPILE

```solidity
function NATIVE_TRANSFER_PRECOMPILE() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### NATIVE_TRANSFER_PRECOMPILE_GAS

```solidity
function NATIVE_TRANSFER_PRECOMPILE_GAS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### SYSTEM

```solidity
function SYSTEM() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### VALIDATOR_PKCHECK_PRECOMPILE

```solidity
function VALIDATOR_PKCHECK_PRECOMPILE() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### VALIDATOR_PKCHECK_PRECOMPILE_GAS

```solidity
function VALIDATOR_PKCHECK_PRECOMPILE_GAS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### acceptOwnership

```solidity
function acceptOwnership() external nonpayable
```



*The new owner accepts the ownership transfer.*


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

### activeValidatorsCount

```solidity
function activeValidatorsCount() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### addToWhitelist

```solidity
function addToWhitelist(address[] whitelistAddreses) external nonpayable
```

Adds addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddreses | address[] | Array of address to whitelist |

### bls

```solidity
function bls() external view returns (contract IBLS)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IBLS | undefined |

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

### disableWhitelisting

```solidity
function disableWhitelisting() external nonpayable
```

Disables the whitelisting feature.

*Only callable by the contract owner.*


### enableWhitelisting

```solidity
function enableWhitelisting() external nonpayable
```

Enables the whitelisting feature.

*Only callable by the contract owner.*


### getActiveValidatorsCount

```solidity
function getActiveValidatorsCount() external view returns (uint256)
```

Gets the number of current validators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Returns the count as uint256 |

### getValidators

```solidity
function getValidators() external view returns (address[])
```

Gets all validators. Returns already unactive validators as well.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | Returns array of addresses |

### hydraDelegationContract

```solidity
function hydraDelegationContract() external view returns (contract IHydraDelegation)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHydraDelegation | undefined |

### hydraStakingContract

```solidity
function hydraStakingContract() external view returns (contract IHydraStaking)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHydraStaking | undefined |

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

### isWhitelisted

```solidity
function isWhitelisted(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isWhitelistingEnabled

```solidity
function isWhitelistingEnabled() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pendingOwner

```solidity
function pendingOwner() external view returns (address)
```



*Returns the address of the pending owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### powerExponent

```solidity
function powerExponent() external view returns (uint256)
```

`powerExponent` represents the numerator of the Voting Power Exponent, where the denominator is 10,000. The Voting Power Exponent is a fractional value between 0.5 and 1, used to exponentially decrease the voting power of a validator. This mechanism encourages better decentralization of the network.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### removeFromWhitelist

```solidity
function removeFromWhitelist(address[] whitelistAddreses) external nonpayable
```

Deletes addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddreses | address[] | Array of address to remove from whitelist |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one. Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### updateExponent

```solidity
function updateExponent(uint256 newValue) external nonpayable
```

Sets new Voting Power Exponent Numerator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New Voting Power Exponent Numerator |

### validators

```solidity
function validators(address) external view returns (uint256 liquidDebt, enum ValidatorStatus status)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| liquidDebt | uint256 | undefined |
| status | enum ValidatorStatus | undefined |

### validatorsAddresses

```solidity
function validatorsAddresses(uint256) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### validatorsParticipation

```solidity
function validatorsParticipation(address) external view returns (uint256)
```

Mapping that keeps the last time when a validator has participated in the consensus

*Keep in mind that the validator will initially be set active when stake, but it will be able to participate in the next epoch. So, the validator will have less blocks to participate before getting eligible for ban.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |



## Events

### AddedToWhitelist

```solidity
event AddedToWhitelist(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### NewValidator

```solidity
event NewValidator(address indexed validator, uint256[4] blsKey)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| blsKey  | uint256[4] | undefined |

### OwnershipTransferStarted

```solidity
event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### PowerExponentUpdated

```solidity
event PowerExponentUpdated(uint256 newPowerExponent)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newPowerExponent  | uint256 | undefined |

### RemovedFromWhitelist

```solidity
event RemovedFromWhitelist(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |



## Errors

### InvalidCommission

```solidity
error InvalidCommission(uint256 commission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| commission | uint256 | undefined |

### InvalidPowerExponent

```solidity
error InvalidPowerExponent()
```






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






### MustBeWhitelisted

```solidity
error MustBeWhitelisted()
```






### PreviouslyWhitelisted

```solidity
error PreviouslyWhitelisted()
```






### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |

### WhitelistingAlreadyDisabled

```solidity
error WhitelistingAlreadyDisabled()
```






### WhitelistingAlreadyEnabled

```solidity
error WhitelistingAlreadyEnabled()
```







