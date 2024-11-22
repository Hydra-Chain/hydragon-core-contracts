# IVestingManager









## Methods

### claimVestedPositionReward

```solidity
function claimVestedPositionReward(address staker, uint256 epochNumber, uint256 balanceChangeIndex) external payable
```

Claims the vested position reward from HydraDelegation contract

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| epochNumber | uint256 | epoch number |
| balanceChangeIndex | uint256 | balance change index |

### cutVestedDelegatePosition

```solidity
function cutVestedDelegatePosition(address staker, uint256 amount) external payable
```

Cuts a vested delegate position and takes the liquid tokens from the position owner

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| amount | uint256 | amount to be cut |

### cutVestedDelegatePositionWithPermit

```solidity
function cutVestedDelegatePositionWithPermit(address staker, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable
```

Cuts a vested delegate position and takes the liquid tokens from the position owner

*The owner of the contract is the only one who can call this functionThe permit function is used to approve the transfer of the liquid tokens*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| amount | uint256 | amount to be cut |
| deadline | uint256 | undefined |
| v | uint8 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |

### openVestedDelegatePosition

```solidity
function openVestedDelegatePosition(address staker, uint256 durationWeeks) external payable
```

Opens a new vested delegate position &amp; receive the liquid tokens

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| staker | address | validator address |
| durationWeeks | uint256 | number of weeks for the vesting period |

### swapVestedPositionStaker

```solidity
function swapVestedPositionStaker(address oldStaker, address newStaker) external nonpayable
```

Swaps the staker of a vested position

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| oldStaker | address | old staker address |
| newStaker | address | new staker address |

### withdraw

```solidity
function withdraw(address to) external nonpayable
```

Withdraws available hydra from HydraDelegation contract

*The owner of the contract is the only one who can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | address to send hydra to |




