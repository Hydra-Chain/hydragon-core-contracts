# HydraChain









## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### DOMAIN

```solidity
function DOMAIN() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

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
function addToWhitelist(address[] whitelistAddresses) external nonpayable
```

Adds addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddresses | address[] | Array of address to whitelist |

### banIsInitiated

```solidity
function banIsInitiated(address validator) external view returns (bool)
```

Returns if a ban process is initiated for a given validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | Returns true if the ban is initiated |

### banThreshold

```solidity
function banThreshold() external view returns (uint256)
```

Threshold for validator inactiveness (in seconds). A validator can be banned if it remains in the ban-initiated state for a duration equal to or exceeding this threshold.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### bansInitiated

```solidity
function bansInitiated(address) external view returns (uint256)
```

Mapping of the validators that bans has been initiated for (validator =&gt; timestamp)



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### bls

```solidity
function bls() external view returns (contract IBLS)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IBLS | undefined |

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

### currentEpochId

```solidity
function currentEpochId() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### daoIncentiveVaultContract

```solidity
function daoIncentiveVaultContract() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

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


### epochEndBlocks

```solidity
function epochEndBlocks(uint256) external view returns (uint256)
```

Array with epoch ending blocks



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### epochs

```solidity
function epochs(uint256) external view returns (uint256 startBlock, uint256 endBlock, bytes32 epochRoot)
```

Epoch data linked with the epoch id



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| startBlock | uint256 | undefined |
| endBlock | uint256 | undefined |
| epochRoot | bytes32 | undefined |

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

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

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
function getValidator(address validatorAddress) external view returns (uint256[4] blsKey, uint256 stake, uint256 totalStake, uint256 commission, uint256 withdrawableRewards, uint256 votingPower, enum ValidatorStatus status, bool isBanInitiated)
```

Gets validator by address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validatorAddress | address | undefined |

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

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleGranted} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

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

### initialize

```solidity
function initialize(ValidatorInit[] newValidators, address governance, address hydraStakingAddr, address hydraDelegationAddr, address rewardWalletAddr, address daoIncentiveVaultAddr, contract IBLS newBls) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newValidators | ValidatorInit[] | undefined |
| governance | address | undefined |
| hydraStakingAddr | address | undefined |
| hydraDelegationAddr | address | undefined |
| rewardWalletAddr | address | undefined |
| daoIncentiveVaultAddr | address | undefined |
| newBls | contract IBLS | undefined |

### initiateBan

```solidity
function initiateBan(address validator) external nonpayable
```

Method used to initiate a ban for validator, if the initiate ban threshold is reached



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### initiateBanThreshold

```solidity
function initiateBanThreshold() external view returns (uint256)
```

Threshold for validator inactiveness (in blocks). A ban can be initiated for a validator if this threshold is reached or exceeded.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### isSubjectToInitiateBan

```solidity
function isSubjectToInitiateBan(address validator) external view returns (bool)
```

Returns if a ban process can be initiated for a given validator

*This function is overridden in the hydra chain contract*

#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | Returns true if the validator is subject to initiate ban |

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

### lastDistribution

```solidity
function lastDistribution() external view returns (uint256)
```

last rewards distribution timestamp




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### maxAllowedValidators

```solidity
function maxAllowedValidators() external view returns (uint256)
```

The maximum amount of validators allowed




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been revoked `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### reporterReward

```solidity
function reporterReward() external view returns (uint256)
```

The reward for the person who reports a validator that have to be banned




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### rewardWalletContract

```solidity
function rewardWalletContract() external view returns (contract IRewardWallet)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IRewardWallet | undefined |

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

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

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

### totalVotingPower

```solidity
function totalVotingPower() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### validatorPenalty

```solidity
function validatorPenalty() external view returns (uint256)
```

The penalty that will be taken and burned from the bad validator&#39;s staked amount




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### validatorPower

```solidity
function validatorPower(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### vaultDistribution

```solidity
function vaultDistribution() external view returns (uint256)
```






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

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

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







