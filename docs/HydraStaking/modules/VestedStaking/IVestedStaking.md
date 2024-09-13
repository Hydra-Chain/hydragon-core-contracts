# IVestedStaking









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

### claimStakingRewards

```solidity
function claimStakingRewards(uint256 rewardHistoryIndex) external nonpayable
```

Claims staking rewards for the sender.



#### Parameters

| Name | Type | Description |
|---|---|---|
| rewardHistoryIndex | uint256 | The index of the reward history to claim rewards from |

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

### stakeWithVesting

```solidity
function stakeWithVesting(uint256 durationWeeks) external payable
```

Stakes sent amount with vesting period.



#### Parameters

| Name | Type | Description |
|---|---|---|
| durationWeeks | uint256 | Duration of the vesting in weeks. Must be between 1 and 52. |




