# ILiquidityToken









## Methods

### burn

```solidity
function burn(address account, uint256 amount) external nonpayable
```

Burns the specified `amount` of tokens from the given account.

*Can only be called by an address with the `SUPPLY_CONTROLLER_ROLE`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address from which tokens will be burned. |
| amount | uint256 | The amount of tokens to burn. |

### mint

```solidity
function mint(address to, uint256 amount) external nonpayable
```

Mints the specified `amount` of tokens to the given address.

*Can only be called by an address with the `SUPPLY_CONTROLLER_ROLE`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | The address to receive the minted tokens. |
| amount | uint256 | The amount of tokens to mint. |




