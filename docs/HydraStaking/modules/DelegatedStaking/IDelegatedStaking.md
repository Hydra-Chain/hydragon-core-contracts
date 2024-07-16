# IDelegatedStaking









## Methods

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




