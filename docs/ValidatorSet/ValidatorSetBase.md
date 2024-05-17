# ValidatorSetBase









## Methods

### DOMAIN

```solidity
function DOMAIN() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

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

### bls

```solidity
function bls() external view returns (contract IBLS)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IBLS | undefined |

### currentEpochId

```solidity
function currentEpochId() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### currentValidators

```solidity
function currentValidators() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### getCurrentValidatorsCount

```solidity
function getCurrentValidatorsCount() external view returns (uint256)
```

Gets the number of current validators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Returns the count as uint256 |

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

### rewardPool

```solidity
function rewardPool() external view returns (contract IRewardPool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IRewardPool | undefined |

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

### updateValidatorParticipation

```solidity
function updateValidatorParticipation(address validator) external nonpayable
```

Method to update when the validator was lastly active which can be executed only by the RewardPool



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | The validator to set the last participation for |

### validatorParticipation

```solidity
function validatorParticipation(address) external view returns (uint256)
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



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

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



