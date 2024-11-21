# IHydraDelegation









## Methods

### applyPendingCommission

```solidity
function applyPendingCommission() external nonpayable
```

Applies pending commission for staker.

*Anyone can apply commission, but if the caller is not active validator, it will not have any effect.*


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
function calculatePositionClaimableReward(address staker, address delegator, uint256 epochNumber, uint256 balanceChangeIndex) external view returns (uint256 reward)
```

Calculates position&#39;s claimable rewards



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |
| epochNumber | uint256 | Epoch where the last claimable reward is distributed We need it because not all rewards are matured at the moment of claiming |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | Delegator&#39;s unclaimed rewards per staker (in HYDRA wei) |

### calculatePositionPenalty

```solidity
function calculatePositionPenalty(address staker, address delegator, uint256 amount) external view returns (uint256 penalty)
```

Calculates the penalty for the position.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to calculate penalty for |
| delegator | address | Delegator to calculate penalty for |
| amount | uint256 | Amount to calculate penalty for |

#### Returns

| Name | Type | Description |
|---|---|---|
| penalty | uint256 | undefined |

### calculatePositionTotalReward

```solidity
function calculatePositionTotalReward(address staker, address delegator, uint256 epochNumber, uint256 balanceChangeIndex) external view returns (uint256 reward)
```

Calculates the delegators&#39;s total rewards distributed (pending and claimable). Pending - such that are not matured so not claimable yet. Claimable - such that are matured and claimable.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |
| epochNumber | uint256 | Epoch where the last reward for the vesting period is distributed |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards for the full position period |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | Pending rewards expected by the delegator from a staker (in HYDRA wei) |

### changeMinDelegation

```solidity
function changeMinDelegation(uint256 newMinDelegation) external nonpayable
```

Changes the minimum delegation amount

*Only callable by the admin*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newMinDelegation | uint256 | New minimum delegation amount |

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

### claimCommission

```solidity
function claimCommission(address to) external nonpayable
```

Claims commission for staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | Address to send the commission to |

### claimDelegatorReward

```solidity
function claimDelegatorReward(address staker) external nonpayable
```

Claims rewards for delegator and commissions for staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

### claimPositionReward

```solidity
function claimPositionReward(address staker, address to, uint256 epochNumber, uint256 balanceChangeIndex) external nonpayable
```

Claims reward for the vest manager (delegator) and distribute it to the desired address. Also commission is distributed to the validator.

*It can be called only by the vest manager*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to claim from |
| to | address | Address to transfer the reward to |
| epochNumber | uint256 | Epoch where the last claimable reward is distributed We need it because not all rewards are matured at the moment of claiming |
| balanceChangeIndex | uint256 | Whether to redelegate the claimed rewards |

### delegate

```solidity
function delegate(address staker) external payable
```

Delegates sent amount to staker, claims rewards and validator comission.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |

### delegateWithVesting

```solidity
function delegateWithVesting(address staker, uint256 durationWeeks) external payable
```

Delegates sent amount to staker. Set vesting position data. Delete old pool params data, if exists. Can be used by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |
| durationWeeks | uint256 | Duration of the vesting in weeks |

### delegationOf

```solidity
function delegationOf(address staker, address delegator) external view returns (uint256)
```

Return the amount of delegation for a delegator to a staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |
| delegator | address | Address of the delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### distributeDelegationRewards

```solidity
function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) external nonpayable
```

Distributes rewards to delegators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |
| reward | uint256 | Amount of rewards to distribute |
| epochId | uint256 | Epoch ID |

### getDelegationPoolParamsHistory

```solidity
function getDelegationPoolParamsHistory(address staker, address delegator) external view returns (struct DelegationPoolDelegatorParams[])
```

Gets the delegation pool params history for a staker and delegator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator that is delegated to |
| delegator | address | Delegator that delegated |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | DelegationPoolDelegatorParams[] | undefined |

### getDelegatorReward

```solidity
function getDelegatorReward(address staker, address delegator) external view returns (uint256)
```

Gets delegator&#39;s unclaimed rewards (with custom APR params)



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of validator |
| delegator | address | Address of delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Delegator&#39;s unclaimed rewards per staker (in HYDRA wei) |

### getRPSValues

```solidity
function getRPSValues(address staker, uint256 startEpoch, uint256 endEpoch) external view returns (struct RPS[])
```

Gets the RPS values for a staker in a given epoch range.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator that is deleagted to |
| startEpoch | uint256 | Start epoch for values |
| endEpoch | uint256 | End epoch for values |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | RPS[] | undefined |

### getRawReward

```solidity
function getRawReward(address staker, address delegator) external view returns (uint256)
```

Returns the raw reward before applying the commission and APR



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |
| delegator | address | Address of the delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Raw reward for the delegator before applying APR and commission |

### isActiveDelegatePosition

```solidity
function isActiveDelegatePosition(address staker, address delegator) external view returns (bool)
```

Returns true if the position is active.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator for the position |
| delegator | address | Delegator for the position |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isBalanceChangeMade

```solidity
function isBalanceChangeMade(address staker, address delegator, uint256 currentEpochNum) external view returns (bool)
```

Checks if balance change was already made in the current epoch



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |
| delegator | address | Delegator that has delegated |
| currentEpochNum | uint256 | Current epoch number |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isInVestingCycleDelegatePosition

```solidity
function isInVestingCycleDelegatePosition(address staker, address delegator) external view returns (bool)
```

Returns true if the position is in the vesting cycle. (Active or maturing)



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator for the position |
| delegator | address | Delegator for the position |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isMaturingDelegatePosition

```solidity
function isMaturingDelegatePosition(address staker, address delegator) external view returns (bool)
```

Returns true if the position is maturing.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator for the position |
| delegator | address | Delegator for the position |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isPositionAvailable

```solidity
function isPositionAvailable(address staker, address delegator) external view returns (bool)
```

Check if the a position that the user wants to delegate to is available

*Available positions are ones that are not active and don&#39;t have any rewards (including maturing rewards)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | The address of the new validator |
| delegator | address | The address of the delegator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isPositionAvailableForSwap

```solidity
function isPositionAvailableForSwap(address staker, address delegator) external view returns (bool)
```

Check if the a position that the user wants to swap to is available

*Available positions are ones that are not active and don&#39;t have any left balance or rewards (including maturing rewards)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to delegate to |
| delegator | address | Delegator that has delegated |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### liquidToken

```solidity
function liquidToken() external view returns (address)
```

Returns the address of the token that is distributed as a liquidity on stake




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### lockCommissionReward

```solidity
function lockCommissionReward(address staker) external nonpayable
```

Locks the commission for the staker

*Only callable by HydraChain*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

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

### setInitialCommission

```solidity
function setInitialCommission(uint256 initialCommission) external nonpayable
```

Sets initial commission for staker.

*the staker needs to have 0 commission and have never used pending commission*

#### Parameters

| Name | Type | Description |
|---|---|---|
| initialCommission | uint256 | Initial commission (100 = 100%) |

### setPendingCommission

```solidity
function setPendingCommission(uint256 newCommission) external nonpayable
```

Sets pending commission for staker.

*The pending commission can be applied by after 15 days.The pending commission can be overridden any time, but the 15 days period will be reset.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newCommission | uint256 | New commission (100 = 100%) |

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

### stakerDelegationCommission

```solidity
function stakerDelegationCommission(address staker) external view returns (uint256)
```

Returns commission for staker.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | commission Commission for staker |

### swapVestedPositionStaker

```solidity
function swapVestedPositionStaker(address oldStaker, address newStaker) external nonpayable
```

Move a vested position to another staker. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldStaker | address | Validator to swap from |
| newStaker | address | Validator to swap to |

### totalDelegation

```solidity
function totalDelegation() external view returns (uint256)
```

Returns the total delegation amount




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalDelegationOf

```solidity
function totalDelegationOf(address staker) external view returns (uint256)
```

Returns the total amount of delegation for a staker



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### undelegate

```solidity
function undelegate(address staker, uint256 amount) external nonpayable
```

Undelegates amount from staker for sender, claims rewards and validator comission.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to undelegate from |
| amount | uint256 | The amount to undelegate |

### undelegateWithVesting

```solidity
function undelegateWithVesting(address staker, uint256 amount) external nonpayable
```

Undelegates amount from staker for vesting position. Apply penalty in case vesting is not finished. Can be called by vesting positions&#39; managers only.



#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Validator to undelegate from |
| amount | uint256 | Amount to be undelegated |

### unlockCommissionReward

```solidity
function unlockCommissionReward(address staker) external nonpayable
```

Unlocks the commission for the staker

*Only callable by HydraChain*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | Address of the validator |

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

### CommissionClaimed

```solidity
event CommissionClaimed(address indexed staker, address indexed to, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| to `indexed` | address | undefined |
| amount  | uint256 | undefined |

### CommissionDistributed

```solidity
event CommissionDistributed(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### CommissionUpdated

```solidity
event CommissionUpdated(address indexed staker, uint256 newCommission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| newCommission  | uint256 | undefined |

### Delegated

```solidity
event Delegated(address indexed staker, address indexed delegator, uint256 amount)
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

### DelegatorRewardsClaimed

```solidity
event DelegatorRewardsClaimed(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PendingCommissionAdded

```solidity
event PendingCommissionAdded(address indexed staker, uint256 newCommission)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| newCommission  | uint256 | undefined |

### PositionCut

```solidity
event PositionCut(address indexed manager, address indexed staker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| staker `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionOpened

```solidity
event PositionOpened(address indexed manager, address indexed staker, uint256 indexed weeksDuration, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| staker `indexed` | address | undefined |
| weeksDuration `indexed` | uint256 | undefined |
| amount  | uint256 | undefined |

### PositionRewardClaimed

```solidity
event PositionRewardClaimed(address indexed manager, address indexed staker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| staker `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PositionSwapped

```solidity
event PositionSwapped(address indexed manager, address indexed oldStaker, address indexed newStaker, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| manager `indexed` | address | undefined |
| oldStaker `indexed` | address | undefined |
| newStaker `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Undelegated

```solidity
event Undelegated(address indexed staker, address indexed delegator, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| staker `indexed` | address | undefined |
| delegator `indexed` | address | undefined |
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

### CommissionRewardLocked

```solidity
error CommissionRewardLocked()
```






### CommissionUpdateNotAvailable

```solidity
error CommissionUpdateNotAvailable()
```






### FailedToBurnAmount

```solidity
error FailedToBurnAmount()
```






### InvalidCommission

```solidity
error InvalidCommission()
```






### InvalidMinDelegation

```solidity
error InvalidMinDelegation()
```






### InvalidWaitPeriod

```solidity
error InvalidWaitPeriod()
```






### NoCommissionToClaim

```solidity
error NoCommissionToClaim()
```






### NoWithdrawalAvailable

```solidity
error NoWithdrawalAvailable()
```






### NotVestingManager

```solidity
error NotVestingManager()
```






### PenaltyRateOutOfRange

```solidity
error PenaltyRateOutOfRange()
```






### WithdrawalFailed

```solidity
error WithdrawalFailed()
```







