# IAPRCalculator









## Methods

### applyBaseAPR

```solidity
function applyBaseAPR(uint256 amount) external view returns (uint256)
```

applies the base APR for the given amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | the amount to apply the APR to |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### applyMacro

```solidity
function applyMacro(uint256 totalStaked) external view returns (uint256 reward)
```

applies macro factor for the given total staked amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| totalStaked | uint256 | the total staked amount to apply the macro factor to |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | undefined |

### applyMaxReward

```solidity
function applyMaxReward(uint256 reward) external view returns (uint256)
```

applies the max reward for the given amount - 52 weeks



#### Parameters

| Name | Type | Description |
|---|---|---|
| reward | uint256 | the reward to apply the max reward to |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### calcVestingBonus

```solidity
function calcVestingBonus(uint256 weeksCount) external view returns (uint256)
```

calculates vesting bonus for the given weeks count



#### Parameters

| Name | Type | Description |
|---|---|---|
| weeksCount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | weeksCount amount of weeks to calculate the bonus for |

### getBaseAPR

```solidity
function getBaseAPR() external view returns (uint256)
```

returns base APR




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getDENOMINATOR

```solidity
function getDENOMINATOR() external pure returns (uint256)
```

returns the denominator for the APR calculation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getEpochsPerYear

```solidity
function getEpochsPerYear() external pure returns (uint256)
```

returns the number of epochs per year




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getRSIBonus

```solidity
function getRSIBonus() external view returns (uint256)
```

returns max reward




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getVestingBonus

```solidity
function getVestingBonus(uint256 weeksCount) external view returns (uint256 nominator)
```

returns the vesting bonus for the given weeks count



#### Parameters

| Name | Type | Description |
|---|---|---|
| weeksCount | uint256 | the amount of weeks to calculate the bonus for |

#### Returns

| Name | Type | Description |
|---|---|---|
| nominator | uint256 | undefined |




