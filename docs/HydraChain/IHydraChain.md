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

### addToWhitelist

```solidity
function addToWhitelist(address[] whitelistAddresses) external nonpayable
```

Adds addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddresses | address[] | Array of address to whitelist |

### banIsInitiated

```solidity
function banIsInitiated(address account) external view returns (bool)
```

Returns if a ban process is initiated for a given validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | Returns true if the ban is initiated |

### banValidator

```solidity
function banValidator(address validator) external nonpayable
```

Method used to ban a validator, if the ban threshold is reached

*This function will validate the threshold only if the executor is not the governance, otherwise will forcedly ban the validator*

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

### disableWhitelisting

```solidity
function disableWhitelisting() external nonpayable
```

Disables the whitelisting feature.

*Only callable by the contract owner.*


### distributeDAOIncentive

```solidity
function distributeDAOIncentive() external nonpayable
```

Distribute vault funds

*Only callable by the system*


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
function getValidator(address validator) external view returns (uint256[4] blsKey, uint256 stake, uint256 totalStake, uint256 commission, uint256 withdrawableRewards, uint256 votingPower, enum ValidatorStatus status, bool isBanInitiated)
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
| commission | uint256 | validator&#39;s cut |
| withdrawableRewards | uint256 | withdrawable rewards |
| votingPower | uint256 | voting power of the validator |
| status | enum ValidatorStatus | status of the validator |
| isBanInitiated | bool | is ban initiated for validator |

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

Gets all validators. Returns already not-active validators as well.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | Returns array of addresses |

### initiateBan

```solidity
function initiateBan(address validator) external nonpayable
```

Method used to initiate a ban for validator, if the initiate ban threshold is reached



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### isSubjectToFinishBan

```solidity
function isSubjectToFinishBan(address account) external view returns (bool)
```

Returns true if a ban can be finally executed for a given validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isValidatorActive

```solidity
function isValidatorActive(address validator) external view returns (bool)
```

Returns bool indicating if validator is Active.



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

Returns bool indicating if validator Banned.



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

Returns bool indicating if validator status is Registered.



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
function register(uint256[2] signature, uint256[4] pubkey, uint256 initialCommission) external nonpayable
```

Validates BLS signature with the provided pubkey and registers validators into the set.

*Validator must be whitelisted.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| signature | uint256[2] | Signature to validate message against |
| pubkey | uint256[4] | BLS public key of validator |
| initialCommission | uint256 | Initial commission (100 = 100%) |

### removeFromWhitelist

```solidity
function removeFromWhitelist(address[] whitelistAddresses) external nonpayable
```

Deletes addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddresses | address[] | Array of address to remove from whitelist |

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

### syncValidatorsData

```solidity
function syncValidatorsData(ValidatorPower[] validatorsPower) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validatorsPower | ValidatorPower[] | undefined |

### terminateBanProcedure

```solidity
function terminateBanProcedure() external nonpayable
```

Method used to terminate the ban procedure




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

Sets new Voting Power Exponent Numerator.

*Can be called only by the governance.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New Voting Power Exponent Numerator |

### updateMaxValidators

```solidity
function updateMaxValidators(uint256 newValue) external nonpayable
```

Sets new max allowed validators count.

*Can be called only by the governance.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New max validators count |



## Events

### AddedToWhitelist

```solidity
event AddedToWhitelist(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### MaxValidatorsUpdated

```solidity
event MaxValidatorsUpdated(uint256 newMaxValidators)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newMaxValidators  | uint256 | undefined |

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

### ValidatorBanned

```solidity
event ValidatorBanned(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### ValidatorsDataSynced

```solidity
event ValidatorsDataSynced(ValidatorPower[] validatorsPower)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validatorsPower  | ValidatorPower[] | undefined |

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

### BanAlreadyInitiated

```solidity
error BanAlreadyInitiated()
```






### CommitEpochFailed

```solidity
error CommitEpochFailed(string reason)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| reason | string | undefined |

### InvalidMaxValidatorCount

```solidity
error InvalidMaxValidatorCount()
```






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






### NoBanInitiated

```solidity
error NoBanInitiated()
```






### NoBanSubject

```solidity
error NoBanSubject()
```






### NoInitiateBanSubject

```solidity
error NoInitiateBanSubject()
```






### NoVaultFundsToClaim

```solidity
error NoVaultFundsToClaim()
```






### PreviouslyWhitelisted

```solidity
error PreviouslyWhitelisted()
```






### WhitelistingAlreadyDisabled

```solidity
error WhitelistingAlreadyDisabled()
```






### WhitelistingAlreadyEnabled

```solidity
error WhitelistingAlreadyEnabled()
```







