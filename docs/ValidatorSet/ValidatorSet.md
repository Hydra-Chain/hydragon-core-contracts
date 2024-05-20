# ValidatorSet









## Methods

### DOMAIN

```solidity
function DOMAIN() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### MAX_COMMISSION

```solidity
function MAX_COMMISSION() external view returns (uint256)
```

A constant for the maximum comission a validator can receive from the delegator&#39;s rewards




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MIN_STAKE_LIMIT

```solidity
function MIN_STAKE_LIMIT() external view returns (uint256)
```

A constant for the minimum stake limit




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

### WITHDRAWAL_WAIT_PERIOD

```solidity
function WITHDRAWAL_WAIT_PERIOD() external view returns (uint256)
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


### addToWhitelist

```solidity
function addToWhitelist(address[] whitelistAddreses) external nonpayable
```

Adds addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddreses | address[] | Array of address to whitelist |

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

Returns the total balance of a given validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Validator&#39;s balance |

### banTreshold

```solidity
function banTreshold() external view returns (uint256)
```

Validator inactiveness (in blocks) threshold that needs to be passed to ban a validator




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### banValidator

```solidity
function banValidator(address validator) external nonpayable
```

Method used to ban a validator, if the ban threshold is reached

*This function will validate the threshold only if the executor is not the governor, otherwise will forcely ban the validator*

#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of the validator |

### bls

```solidity
function bls() external view returns (contract IBLS)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IBLS | undefined |

### changeMinStake

```solidity
function changeMinStake(uint256 newMinStake) external nonpayable
```

Changes minimum stake required for validators.

*Should be called by the Governance.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newMinStake | uint256 | New minimum stake |

### changeWithdrawalWaitPeriod

```solidity
function changeWithdrawalWaitPeriod(uint256 newWaitPeriod) external nonpayable
```

Changes the withdrawal wait period.

*This function should be called only by the Governed contract.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newWaitPeriod | uint256 | The new withdrawal wait period. MUST be longer than a single  epoch (in some realistic worst-case scenario) in case somebody&#39;s stake needs to be penalized. |

### commitEpoch

```solidity
function commitEpoch(uint256 id, Epoch epoch, uint256 epochSize) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |
| epoch | Epoch | undefined |
| epochSize | uint256 | undefined |

### currentEpochId

```solidity
function currentEpochId() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### delegate

```solidity
function delegate(address validator) external payable
```

Delegates sent amount to validator and claims rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to delegate to |

### delegateWithVesting

```solidity
function delegateWithVesting(address validator, uint256 durationWeeks) external payable
```

Delegates sent amount to validator. Set vesting position data. Delete old top-ups data if exists. Can be called by vesting positions&#39; managers only. Can be used by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to delegate to |
| durationWeeks | uint256 | Duration of the vesting in weeks |

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
| numerator | uint256 | undefined |
| denominator | uint256 | undefined |

### getUserVestManagers

```solidity
function getUserVestManagers(address user) external view returns (address[])
```

Gets the vesting managers per user address for fast off-chain lookup.



#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |

### getValidator

```solidity
function getValidator(address validatorAddress) external view returns (uint256[4] blsKey, uint256 stake, uint256 totalStake, uint256 commission, uint256 withdrawableRewards, bool active)
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

### implementation

```solidity
function implementation() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### initialize

```solidity
function initialize(InitStruct init, ValidatorInit[] newValidators, contract IBLS newBls, contract IRewardPool newRewardPool, address governance, address liquidToken, uint256 initialCommission) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| init | InitStruct | undefined |
| newValidators | ValidatorInit[] | undefined |
| newBls | contract IBLS | undefined |
| newRewardPool | contract IRewardPool | undefined |
| governance | address | undefined |
| liquidToken | address | undefined |
| initialCommission | uint256 | undefined |

### isVestingManager

```solidity
function isVestingManager(address delegator) external view returns (bool)
```

Claims that a delegator is a vest manager or not.



#### Parameters

| Name | Type | Description |
|---|---|---|
| delegator | address | Delegator&#39;s address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### liquidToken

```solidity
function liquidToken() external view returns (address)
```

Returns the address of the liquidity token.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### minStake

```solidity
function minStake() external view returns (uint256)
```

A state variable to keep the minimum amount of stake




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### newManager

```solidity
function newManager(address rewardPool) external nonpayable
```

Creates new vesting manager which owner is the caller. Every new instance is proxy leading to base impl, so minimal fees are applied. Only Vesting manager can use the vesting functionality, so users need to create a manager first to be able to vest.



#### Parameters

| Name | Type | Description |
|---|---|---|
| rewardPool | address | undefined |

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

### pendingWithdrawals

```solidity
function pendingWithdrawals(address account) external view returns (uint256)
```

Calculates how much is yet to become withdrawable for account.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The account to calculate amount for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Amount not yet withdrawable (in wei) |

### powerExponent

```solidity
function powerExponent() external view returns (uint128 value, uint128 pendingValue)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| value | uint128 | undefined |
| pendingValue | uint128 | undefined |

### register

```solidity
function register(uint256[2] signature, uint256[4] pubkey, uint256 commission) external nonpayable
```

Validates BLS signature with the provided pubkey and registers validators into the set.



#### Parameters

| Name | Type | Description |
|---|---|---|
| signature | uint256[2] | Signature to validate message against |
| pubkey | uint256[4] | BLS public key of validator |
| commission | uint256 | The commission rate for the delegators |

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


### reporterReward

```solidity
function reporterReward() external view returns (uint256)
```

The reward for the person who reports a validator that have to be banned




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### rewardPool

```solidity
function rewardPool() external view returns (contract IRewardPool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IRewardPool | undefined |

### setBanThreshold

```solidity
function setBanThreshold(uint256 newThreshold) external nonpayable
```

Set the threshold that needs to be reached to ban a validator



#### Parameters

| Name | Type | Description |
|---|---|---|
| newThreshold | uint256 | The new threshold in blocks |

### setCommission

```solidity
function setCommission(uint256 newCommission) external nonpayable
```

Sets commission for validator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| newCommission | uint256 | New commission (100 = 100%) |

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

### stake

```solidity
function stake() external payable
```

Stakes sent amount.




### stakeBalances

```solidity
function stakeBalances(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### stakeWithVesting

```solidity
function stakeWithVesting(uint256 durationWeeks) external payable
```

Stakes sent amount with vesting period.



#### Parameters

| Name | Type | Description |
|---|---|---|
| durationWeeks | uint256 | Duration of the vesting in weeks. Must be between 1 and 52. |

### topUpDelegatePosition

```solidity
function topUpDelegatePosition(address validator) external payable
```

Delegates sent amount to validator increasing an already created with `delegateWithVesting` vesting position. This modifies the vesting conditions. Can be called by vesting positions&#39; managers only.

*Add top-up data.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to delegate to |

### totalBalance

```solidity
function totalBalance() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Returns the total supply




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Total supply |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one. Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### undelegate

```solidity
function undelegate(address validator, uint256 amount) external nonpayable
```

Undelegates amount from validator for sender and claims rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to undelegate from |
| amount | uint256 | The amount to undelegate |

### undelegateWithVesting

```solidity
function undelegateWithVesting(address validator, uint256 amount) external nonpayable
```

Undelegates amount from validator for vesting position. Apply penalty in case vesting is not finished. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to undelegate from |
| amount | uint256 | Amount to be undelegated |

### unstake

```solidity
function unstake(uint256 amount) external nonpayable
```

Unstakes amount for sender. Claims rewards beforehand.



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | Amount to unstake |

### updateExponent

```solidity
function updateExponent(uint256 newValue) external nonpayable
```

Set new pending exponent, to be activated in the next commit epoch



#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New Voting Power Exponent Numerator |

### updateValidatorParticipation

```solidity
function updateValidatorParticipation(address validator) external nonpayable
```

Method to update when the validator was lastly active which can be executed only by the RewardPool



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | The validator to set the last participation for |

### userVestManagers

```solidity
function userVestManagers(address, uint256) external view returns (address)
```

Additional mapping to store all vesting managers per user address for fast off-chain lookup



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### validatorParticipation

```solidity
function validatorParticipation(address) external view returns (uint256)
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

### validatorPenalty

```solidity
function validatorPenalty() external view returns (uint256)
```

The penalty that will be taken and burned from the bad valiator&#39;s staked amount




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### validators

```solidity
function validators(address) external view returns (uint256 liquidDebt, uint256 commission, enum ValidatorStatus status)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| liquidDebt | uint256 | undefined |
| commission | uint256 | undefined |
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

### vestManagers

```solidity
function vestManagers(address) external view returns (address)
```

vesting manager =&gt; owner



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### withdraw

```solidity
function withdraw(address to) external nonpayable
```

Withdraws sender&#39;s withdrawable amount to specified address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | Address to withdraw to |

### withdrawBannedFunds

```solidity
function withdrawBannedFunds() external nonpayable
```

Withdraw funds left for a banned validator

*Function can be executed only by the banned validator*


### withdrawable

```solidity
function withdrawable(address account) external view returns (uint256 amount)
```

Calculates how much can be withdrawn for account at this time.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The account to calculate amount for |

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | Amount withdrawable (in wei) |

### withdrawalBalances

```solidity
function withdrawalBalances(address) external view returns (uint256 liquidTokens, uint256 withdrawableAmount)
```

The withdrawal info that is required for a banned validator to withdraw the funds left



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| liquidTokens | uint256 | undefined |
| withdrawableAmount | uint256 | undefined |



## Events

### AddedToWhitelist

```solidity
event AddedToWhitelist(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### CommissionUpdated

```solidity
event CommissionUpdated(address indexed validator, uint256 newCommission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| newCommission  | uint256 | undefined |

### Delegated

```solidity
event Delegated(address indexed validator, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### NewClone

```solidity
event NewClone(address indexed owner, address newClone)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| newClone  | address | undefined |

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

### PositionCut

```solidity
event PositionCut(address indexed manager, address indexed validator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| validator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionOpened

```solidity
event PositionOpened(address indexed manager, address indexed validator, uint256 indexed weeksDuration, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| validator `indexed` | address | undefined |
| weeksDuration `indexed` | uint256 | undefined |
| amount  | uint256 | undefined |

### PositionTopUp

```solidity
event PositionTopUp(address indexed manager, address indexed validator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| validator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### RemovedFromWhitelist

```solidity
event RemovedFromWhitelist(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### StakeChanged

```solidity
event StakeChanged(address indexed validator, uint256 newStake)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| newStake  | uint256 | undefined |

### Staked

```solidity
event Staked(address indexed validator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Undelegated

```solidity
event Undelegated(address indexed validator, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Unstaked

```solidity
event Unstaked(address indexed validator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### ValidatorBanned

```solidity
event ValidatorBanned(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### WithdrawalFinished

```solidity
event WithdrawalFinished(address indexed account, address indexed to, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| to `indexed` | address | undefined |
| amount  | uint256 | undefined |

### WithdrawalRegistered

```solidity
event WithdrawalRegistered(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |



## Errors

### DelegateRequirement

```solidity
error DelegateRequirement(string src, string msg)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| src | string | undefined |
| msg | string | undefined |

### InvalidCommission

```solidity
error InvalidCommission(uint256 commission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| commission | uint256 | undefined |

### InvalidMinStake

```solidity
error InvalidMinStake()
```






### InvalidSignature

```solidity
error InvalidSignature(address signer)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signer | address | undefined |

### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### LowStake

```solidity
error LowStake()
```






### MustBeWhitelisted

```solidity
error MustBeWhitelisted()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```






### NotVestingManager

```solidity
error NotVestingManager()
```






### PreviouslyWhitelisted

```solidity
error PreviouslyWhitelisted()
```






### StakeRequirement

```solidity
error StakeRequirement(string src, string msg)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| src | string | undefined |
| msg | string | undefined |

### ThresholdNotReached

```solidity
error ThresholdNotReached()
```






### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |


