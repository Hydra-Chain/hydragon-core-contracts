# IRewardWallet









## Methods

### distributeReward

```solidity
function distributeReward(address to, uint256 amount) external nonpayable
```

Distribute the specified `amount` of coins to the given address.

*Can only be called by a manager address, e.g., HydraStaking or HydraChain contracts.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | The address to receive the coins. |
| amount | uint256 | The amount of coins to send. |



## Events

### Received

```solidity
event Received(address indexed from, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| amount  | uint256 | undefined |

### RewardDistributed

```solidity
event RewardDistributed(address indexed account, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account `indexed` | address | undefined |
| amount  | uint256 | undefined |



