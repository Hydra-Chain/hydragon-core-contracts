# IDaoIncentive









## Methods

### claimVaultFunds

```solidity
function claimVaultFunds() external nonpayable
```

Claim distributed vault funds




### distributeDAOIncentive

```solidity
function distributeDAOIncentive() external nonpayable
```

Distribute vault funds

*Only callable by the system*




## Events

### VaultFunded

```solidity
event VaultFunded(uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |

### VaultFundsDistributed

```solidity
event VaultFundsDistributed(uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |



## Errors

### NoVaultFundsToClaim

```solidity
error NoVaultFundsToClaim()
```







