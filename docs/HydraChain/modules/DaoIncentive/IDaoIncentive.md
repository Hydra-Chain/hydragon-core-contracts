# IDaoIncentive









## Methods

### claimVaultFunds

```solidity
function claimVaultFunds() external nonpayable
```

Claim distributed vault funds




### distributeVaultFunds

```solidity
function distributeVaultFunds() external nonpayable
```

Distribute vault funds

*Only callable by the system*


### getCurrentEpochId

```solidity
function getCurrentEpochId() external view returns (uint256)
```

Get current epoch ID




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |



## Events

### VaultFunded

```solidity
event VaultFunded(uint256 indexed epoch, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| epoch `indexed` | uint256 | undefined |
| amount  | uint256 | undefined |

### VaultFundsDistributed

```solidity
event VaultFundsDistributed(uint256 indexed epoch, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| epoch `indexed` | uint256 | undefined |
| amount  | uint256 | undefined |



