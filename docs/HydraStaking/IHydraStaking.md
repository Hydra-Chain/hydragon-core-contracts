# IHydraStaking









## Methods

### calcVestedStakingPositionPenalty

```solidity
function calcVestedStakingPositionPenalty(address staker, uint256 amount) external view returns (uint256 penalty, uint256 reward)
```

Returns the penalty and reward that will be burned, if vested stake position is active



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |
| amount | uint256 | The amount that is going to be unstaked |

#### Returns

| Name | Type | Description |
|---|---|---|
| penalty | uint256 | for the staker |
| reward | uint256 | of the staker |

### calculateOwedLiquidTokens

```solidity
function calculateOwedLiquidTokens(address account, uint256 amount) external view returns (uint256)
```

Returns the amount of liquid tokens the user owes to the protocol based on the given amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address of the account |
| amount | uint256 | The amount to be checked |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The amount of liquid tokens the user owes to the protocol |

### calculatePositionClaimableReward

```solidity
function calculatePositionClaimableReward(address staker, uint256 rewardHistoryIndex) external view returns (uint256)
```

Calculates the staker&#39;s vested position claimable (already matured) rewards.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |
| rewardHistoryIndex | uint256 | The index of the reward history at time that is already matured |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | claimable reward of the staker* |

### calculatePositionTotalReward

```solidity
function calculatePositionTotalReward(address staker) external view returns (uint256)
```

Calculates the staker&#39;s total (pending + claimable) rewards. Pending - such that are not matured so not claimable yet. Claimable - such that are matured and claimable.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Pending rewards expected by the vested staker&#39;s position (in HYDRA wei) |

### changeMinStake

```solidity
function changeMinStake(uint256 newMinStake) external nonpayable
```

Changes minimum stake required for stakers.

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

### claimStakingRewards

```solidity
function claimStakingRewards() external nonpayable
```

Claims staking rewards for the sender.




### claimStakingRewards

```solidity
function claimStakingRewards(uint256 rewardHistoryIndex) external nonpayable
```

Claims staking rewards for the sender.



#### Parameters

| Name | Type | Description |
|---|---|---|
| rewardHistoryIndex | uint256 | The index of the reward history to claim rewards from |

### distributeRewardsFor

```solidity
function distributeRewardsFor(uint256 epochId, Uptime[] uptime) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| epochId | uint256 | undefined |
| uptime | Uptime[] | undefined |

### getStakingRewardsHistoryValues

```solidity
function getStakingRewardsHistoryValues(address staker) external view returns (struct StakingRewardsHistory[])
```

Returns historical records of the staking rewards of the user



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | StakingRewardsHistory[] | stakingRewardsHistory array with the historical records of the staking rewards of the user |

### liquidToken

```solidity
function liquidToken() external view returns (address)
```

Returns the address of the token that is distributed as a liquidity on stake




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### onDelegate

```solidity
function onDelegate(address staker) external nonpayable
```

Called by the delegation contract when a user delegates to a staker

*This function should be called by the delegation contractThis function also checks if the validator is active*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |

### onUndelegate

```solidity
function onUndelegate(address staker) external nonpayable
```

Called by the delegation contract when a user undelegates from a staker

*This function should be called by the delegation contract*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |

### penalizeStaker

```solidity
function penalizeStaker(address staker, PenalizedStakeDistribution[] stakeDistributions) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | undefined |
| stakeDistributions | PenalizedStakeDistribution[] | undefined |

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

### recoverEjectedValidator

```solidity
function recoverEjectedValidator(address account) external nonpayable
```

Return back a validator after temporary removal from the validator set by emitting a balance changed event

*related to the temporaryEjectValidator function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | address of the validator to be returned |

### setPenaltyDecreasePerWeek

```solidity
function setPenaltyDecreasePerWeek(uint256 newRate) external nonpayable
```

sets a new penalty rate

*Only callable by the adminthe rate should be between 10 and 150 (0.1% and 1.5%)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newRate | uint256 | the new penalty rate |

### stake

```solidity
function stake() external payable
```

Stakes sent amount.




### stakeOf

```solidity
function stakeOf(address account) external view returns (uint256)
```

Returns staked amount for the given account.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Staker address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### stakeWithVesting

```solidity
function stakeWithVesting(uint256 durationWeeks) external payable
```

Stakes sent amount with vesting period.

*The staker also claims any rewards before opening a new position, to avoid locking them during vesting cycleIf staker has stake already, the whole stake will be in the position*

#### Parameters

| Name | Type | Description |
|---|---|---|
| durationWeeks | uint256 | Duration of the vesting in weeks. Must be between 1 and 52. |

### temporaryEjectValidator

```solidity
function temporaryEjectValidator(address account) external nonpayable
```

Allows temporary removal of a validator from the validator set by emitting a balance changed event

*It breaks the normal flow of the system contracts but is the fastest way to achieve two-step ban functionality*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | address of the validator to be removed |

### totalBalance

```solidity
function totalBalance() external view returns (uint256)
```

Returns total staked balance for all stakers and delegators




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalBalanceOf

```solidity
function totalBalanceOf(address staker) external view returns (uint256)
```

Returns total balance staked + delegated



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the staker |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### unclaimedRewards

```solidity
function unclaimedRewards(address account) external view returns (uint256)
```

Returns unclaimed rewards for the given account.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Staker address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### withdrawBannedFunds

```solidity
function withdrawBannedFunds() external nonpayable
```

Withdraws the funds of a banned validator




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

### DistributeRewardFailed

```solidity
error DistributeRewardFailed(string message)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| message | string | undefined |

### FailedToBurnAmount

```solidity
error FailedToBurnAmount()
```






### InvalidMinStake

```solidity
error InvalidMinStake()
```






### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoFundsToWithdraw

```solidity
error NoFundsToWithdraw()
```






### NoRewards

```solidity
error NoRewards()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```






### PenaltyRateOutOfRange

```solidity
error PenaltyRateOutOfRange()
```






### StakeLeftLow

```solidity
error StakeLeftLow()
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

### WithdrawalFailed

```solidity
error WithdrawalFailed()
```







