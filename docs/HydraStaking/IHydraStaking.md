# IHydraStaking









## Methods

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




### distributeRewardsFor

```solidity
function distributeRewardsFor(uint256 epochId, Uptime[] uptime) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| epochId | uint256 | undefined |
| uptime | Uptime[] | undefined |

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

Return back a validator after temporary removal from the validator set by emiting a balance changed event

*related to the temporaryEjectValidator function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | address of the validator to be returned |

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

### temporaryEjectValidator

```solidity
function temporaryEjectValidator(address account) external nonpayable
```

Allows temporary removal of a validator from the validator set by emiting a balance changed event

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







