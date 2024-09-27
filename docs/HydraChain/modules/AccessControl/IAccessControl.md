# IAccessControl









## Methods

### addToWhitelist

```solidity
function addToWhitelist(address[] whitelistAddreses) external nonpayable
```

Adds addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddreses | address[] | Array of address to whitelist |

### disableWhitelisting

```solidity
function disableWhitelisting() external nonpayable
```

Disables the whitelisting feature.

*Only callable by the contract owner.*


### enableWhitelisting

```solidity
function enableWhitelisting() external nonpayable
```

Enables the whitelisting feature.

*Only callable by the contract owner.*


### removeFromWhitelist

```solidity
function removeFromWhitelist(address[] whitelistAddreses) external nonpayable
```

Deletes addresses that are allowed to register as validators.



#### Parameters

| Name | Type | Description |
|---|---|---|
| whitelistAddreses | address[] | Array of address to remove from whitelist |



## Events

### AddedToWhitelist

```solidity
event AddedToWhitelist(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |

### RemovedFromWhitelist

```solidity
event RemovedFromWhitelist(address indexed validator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| validator `indexed` | address | undefined |



## Errors

### MustBeWhitelisted

```solidity
error MustBeWhitelisted()
```






### PreviouslyWhitelisted

```solidity
error PreviouslyWhitelisted()
```






### WhitelistingAlreadyDisabled

```solidity
error WhitelistingAlreadyDisabled()
```






### WhitelistingAlreadyEnabled

```solidity
error WhitelistingAlreadyEnabled()
```







