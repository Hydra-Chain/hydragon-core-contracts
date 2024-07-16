# IPowerExponent

*H_MODIFY*

> PowerExponent

Storing Voting Power Exponent Numerator (Denominator is 10000). Client use it to calculate voting power.

*Voting Power = staked balance ^ (numerator / denominator)*

## Methods

### getExponent

```solidity
function getExponent() external view returns (uint256 numerator, uint256 denominator)
```

Return the Voting Power Exponent Numerator and Denominator




#### Returns

| Name | Type | Description |
|---|---|---|
| numerator | uint256 | Voting Power Exponent Numerator |
| denominator | uint256 | Voting Power Exponent Denominator |

### updateExponent

```solidity
function updateExponent(uint256 newValue) external nonpayable
```

Set new pending exponent, to be activated in the next commit epoch



#### Parameters

| Name | Type | Description |
|---|---|---|
| newValue | uint256 | New Voting Power Exponent Numerator |




