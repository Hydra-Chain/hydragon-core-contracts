# StateSyncer



> StateSyncer

This contract is used to emit a specific event on stake, unstake, delegate and undelegate; Child chain listen for this event to sync the state of the validators




## Events

### StakeChanged

```solidity
event StakeChanged(address indexed validator, uint256 newStake)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |
| newStake  | uint256 | undefined |



