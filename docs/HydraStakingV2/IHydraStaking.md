# IHydraStaking









## Methods

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
| newWaitPeriod | uint256 | The new withdrawal wait period. MUST be longer than a single epoch (in some realistic worst-case scenario) in case somebody&#39;s stake needs to be penalized. |

### claimPositionReward

```solidity
function claimPositionReward(address validator, address to, uint256 epochNumber, uint256 balanceChangeIndex) external nonpayable
```

Claims reward for the vest manager (delegator).



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to claim from |
| to | address | Address to transfer the reward to |
| epochNumber | uint256 | Epoch where the last claimable reward is distributed We need it because not all rewards are matured at the moment of claiming |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards |

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

Delegates sent amount to validator. Set vesting position data. Delete old pool params data, if exists. Can be used by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Validator to delegate to |
| durationWeeks | uint256 | Duration of the vesting in weeks |

### distributeRewardsFor

```solidity
function distributeRewardsFor(uint256 epochId, Uptime[] uptime, uint256 epochSize) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| epochId | uint256 | undefined |
| uptime | Uptime[] | undefined |
| epochSize | uint256 | undefined |

### getRawDelegatorReward

```solidity
function getRawDelegatorReward(address validator, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards index (without custom APR params applied)



#### Parameters

| Name | Type | Description |
|---|---|---|
| validator | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards index per validator (in HYDRA wei) |

### getUserVestingManagers

```solidity
function getUserVestingManagers(address user) external view returns (address[])
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

### liquidToken

```solidity
function liquidToken() external view returns (address)
```

Returns the address of the token that is distributed as a liquidity on stake




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### newManager

```solidity
function newManager(address rewardPool) external nonpayable
```

Creates new vesting manager which owner is the caller. Every new instance is proxy leading to base impl, so minimal fees are applied. Only Vesting manager can use the vesting functionality, so users need to create a manager first to be able to vest.



#### Parameters

| Name | Type | Description |
|---|---|---|
| rewardPool | address | undefined |

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

### setCommission

```solidity
function setCommission(uint256 newCommission) external nonpayable
```

Sets commission for validator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| newCommission | uint256 | New commission (100 = 100%) |

### stake

```solidity
function stake() external payable
```

Stakes sent amount.




### swapVestedPositionValidator

```solidity
function swapVestedPositionValidator(address oldValidator, address newValidator) external nonpayable
```

Move a vested position to another validator. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldValidator | address | Validator to swap from |
| newValidator | address | Validator to swap to |

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

### withdraw

```solidity
function withdraw(address to) external nonpayable
```

Withdraws sender&#39;s withdrawable amount to specified address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | Address to withdraw to |

### withdrawable

```solidity
function withdrawable(address account) external view returns (uint256)
```

Calculates how much can be withdrawn for account at this time.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The account to calculate amount for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Amount withdrawable (in wei) |



## Events

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

### DelegatorRewardClaimed

```solidity
event DelegatorRewardClaimed(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### DelegatorRewardDistributed

```solidity
event DelegatorRewardDistributed(address indexed staker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| amount  | uint256 | undefined |

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

### PositionRewardClaimed

```solidity
event PositionRewardClaimed(address indexed manager, address indexed validator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| validator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionSwapped

```solidity
event PositionSwapped(address indexed manager, address indexed oldValidator, address newValidator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| oldValidator `indexed` | address | undefined |
| newValidator  | address | undefined |
| amount  | uint256 | undefined |

### Staked

```solidity
event Staked(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

### StakingRewardDistributed

```solidity
event StakingRewardDistributed(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

### StakingRewardsClaimed

```solidity
event StakingRewardsClaimed(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
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
event Unstaked(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |

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






### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoRewards

```solidity
error NoRewards()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
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

