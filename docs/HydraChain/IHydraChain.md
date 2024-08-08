# IHydraChain









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

### claimVaultFunds

```solidity
function claimVaultFunds() external nonpayable
```

Claim distributed vault funds




### commitEpoch

```solidity
function commitEpoch(uint256 id, Epoch epoch, uint256 epochSize, Uptime[] uptime) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |
| epoch | Epoch | undefined |
| epochSize | uint256 | undefined |
| uptime | Uptime[] | undefined |

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

### distributeDAOIncentive

```solidity
function distributeDAOIncentive() external nonpayable
```

Distribute vault funds

*Only callable by the system*


### getActiveValidatorsCount

```solidity
function getActiveValidatorsCount() external view returns (uint256)
```

Gets the number of current validators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Returns the count as uint256 |

### getCurrentEpochId

```solidity
function getCurrentEpochId() external view returns (uint256)
```

Get current epoch ID




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getEpochByBlock

```solidity
function getEpochByBlock(uint256 blockNumber) external view returns (struct Epoch)
```

Look up an epoch by block number. Searches in O(log n) time.



#### Parameters

| Name | Type | Description |
|---|---|---|
| blockNumber | uint256 | ID of epoch to be committed |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | Epoch | Epoch Returns epoch if found, or else, the last epoch |

### getExponent

```solidity
function getExponent() external view returns (uint256 numerator, uint256 denominator)
```

Return the Voting Power Exponent Numerator and Denominator




#### Returns

| Name | Type | Description |
|---|---|---|
| numerator | uint256 | Voting Power Exponent Numerator |
| denominator | uint256 | Voting Power Exponent Denominator |

### getTotalVotingPower

```solidity
function getTotalVotingPower() external view returns (uint256)
```

Returns the total voting power of the validators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint256 Total voting power of the validators |

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

### syncValidatorsData

```solidity
function syncValidatorsData(ValidatorPower[] validatorsPower) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validatorsPower | ValidatorPower[] | undefined |

### totalBlocks

```solidity
function totalBlocks(uint256 epochId) external view returns (uint256 length)
```

Total amount of blocks in a given epoch



#### Parameters

| Name | Type | Description |
|---|---|---|
| epochId | uint256 | The number of the epoch |

#### Returns

| Name | Type | Description |
|---|---|---|
| length | uint256 | Total blocks for an epoch |

### updateExponent

```solidity
function updateExponent(uint256 newValue) external nonpayable
```

Set new pending exponent, to be activated in the next commit epoch



#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New Voting Power Exponent Numerator |



## Events

### NewEpoch

```solidity
event NewEpoch(uint256 indexed id, uint256 indexed startBlock, uint256 indexed endBlock, bytes32 epochRoot)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| startBlock `indexed` | uint256 | undefined |
| endBlock `indexed` | uint256 | undefined |
| epochRoot  | bytes32 | undefined |

### NewValidator

```solidity
event NewValidator(address indexed validator, uint256[4] blsKey)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| blsKey  | uint256[4] | undefined |

### ValidatorBanned

```solidity
event ValidatorBanned(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### VaultFunded

```solidity
event VaultFunded(uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |

### VaultFundsDistributed

```solidity
event VaultFundsDistributed(uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |



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






### NoBanSubject

```solidity
error NoBanSubject()
```







