# APRCalculator









## Methods

### BASE_APR

```solidity
function BASE_APR() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### DENOMINATOR

```solidity
function DENOMINATOR() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### FAST_SMA

```solidity
function FAST_SMA() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MAX_MACRO_FACTOR

```solidity
function MAX_MACRO_FACTOR() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MAX_RSI_BONUS

```solidity
function MAX_RSI_BONUS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MIN_MACRO_FACTOR

```solidity
function MIN_MACRO_FACTOR() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### NATIVE_TOKEN_CONTRACT

```solidity
function NATIVE_TOKEN_CONTRACT() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### NATIVE_TRANSFER_PRECOMPILE

```solidity
function NATIVE_TRANSFER_PRECOMPILE() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### NATIVE_TRANSFER_PRECOMPILE_GAS

```solidity
function NATIVE_TRANSFER_PRECOMPILE_GAS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### SLOW_SMA

```solidity
function SLOW_SMA() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### SYSTEM

```solidity
function SYSTEM() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### VALIDATOR_PKCHECK_PRECOMPILE

```solidity
function VALIDATOR_PKCHECK_PRECOMPILE() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### VALIDATOR_PKCHECK_PRECOMPILE_GAS

```solidity
function VALIDATOR_PKCHECK_PRECOMPILE_GAS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### applyBaseAPR

```solidity
function applyBaseAPR(uint256 amount) external pure returns (uint256)
```

Applies the base APR for the given amount



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

Applies macro factor for the given total staked amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| totalStaked | uint256 | the total staked amount to apply the macro factor to |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | undefined |

### averageGain

```solidity
function averageGain() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### averageLoss

```solidity
function averageLoss() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### changeDefaultMacroFactor

```solidity
function changeDefaultMacroFactor(uint256 _macroFactor) external nonpayable
```

Change the default macro factor

*only governance can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _macroFactor | uint256 | The new default macro factor |

### defaultMacroFactor

```solidity
function defaultMacroFactor() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### disableGuard

```solidity
function disableGuard() external nonpayable
```

Enables the RSI bonus and Macro factor updates again

*only governance can call this function*


### disabledBonusesUpdates

```solidity
function disabledBonusesUpdates() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### getBaseAPR

```solidity
function getBaseAPR() external pure returns (uint256)
```

Returns base APR




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getDENOMINATOR

```solidity
function getDENOMINATOR() external pure returns (uint256)
```

Returns the denominator for the APR calculation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getMacroFactor

```solidity
function getMacroFactor() external view returns (uint256)
```

Get the macro factor

*return the macro factor*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | macro factor |

### getMaxAPR

```solidity
function getMaxAPR() external view returns (uint256 nominator, uint256 denominator)
```

Returns the max APR for 52 weeks




#### Returns

| Name | Type | Description |
|---|---|---|
| nominator | uint256 | the nominator for the max APR |
| denominator | uint256 | the denominator for the max APR |

### getMaxYearlyReward

```solidity
function getMaxYearlyReward(uint256 totalStaked) external view returns (uint256 reward)
```

Returns the max yearly reward for the given total staked amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| totalStaked | uint256 | the total staked amount to apply the max APR params to |

#### Returns

| Name | Type | Description |
|---|---|---|
| reward | uint256 | undefined |

### getRSIBonus

```solidity
function getRSIBonus() external view returns (uint256)
```

Get the rsi

*return the rsi*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | RSIndex |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### getVestingBonus

```solidity
function getVestingBonus(uint256 weeksCount) external view returns (uint256 nominator)
```

Returns the vesting bonus for the given weeks count



#### Parameters

| Name | Type | Description |
|---|---|---|
| weeksCount | uint256 | the amount of weeks to calculate the bonus for |

#### Returns

| Name | Type | Description |
|---|---|---|
| nominator | uint256 | undefined |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleGranted} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### guardBonuses

```solidity
function guardBonuses() external nonpayable
```

Protects RSI bonus and Macro factor updates and set them to default values

*only governance can call this function*


### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hydraChainContract

```solidity
function hydraChainContract() external view returns (contract IHydraChain)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHydraChain | undefined |

### initialize

```solidity
function initialize(address governance, address hydraChainAddr, address priceOracleAddr, uint256[310] prices) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| governance | address | undefined |
| hydraChainAddr | address | undefined |
| priceOracleAddr | address | undefined |
| prices | uint256[310] | undefined |

### latestDailyPrice

```solidity
function latestDailyPrice() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### macroFactor

```solidity
function macroFactor() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### priceOracleContract

```solidity
function priceOracleContract() external view returns (contract IPriceOracle)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IPriceOracle | undefined |

### pricePerDay

```solidity
function pricePerDay(uint256) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been revoked `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### rsi

```solidity
function rsi() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### smaFastSum

```solidity
function smaFastSum() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### smaSlowSum

```solidity
function smaSlowSum() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### updatePrice

```solidity
function updatePrice(uint256 _price, uint256 _day) external nonpayable
```

Updates the price for the last day

*only the PriceOracle can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _price | uint256 | undefined |
| _day | uint256 | undefined |

### updatedPrices

```solidity
function updatedPrices(uint256) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### vestingBonus

```solidity
function vestingBonus(uint256) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |



## Events

### DefaultMacroFactorChanged

```solidity
event DefaultMacroFactorChanged(uint256 macroFactor)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| macroFactor  | uint256 | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### MacroFactorSet

```solidity
event MacroFactorSet(uint256 macroFactor)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| macroFactor  | uint256 | undefined |

### PriceUpdated

```solidity
event PriceUpdated(uint256 day, uint256 price)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| day  | uint256 | undefined |
| price  | uint256 | undefined |

### RSIBonusSet

```solidity
event RSIBonusSet(uint256 rsiBonus)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| rsiBonus  | uint256 | undefined |

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |



## Errors

### GuardAlreadyDisabled

```solidity
error GuardAlreadyDisabled()
```






### GuardAlreadyEnabled

```solidity
error GuardAlreadyEnabled()
```






### InvalidMacroFactor

```solidity
error InvalidMacroFactor()
```






### InvalidRSI

```solidity
error InvalidRSI()
```






### Unauthorized

```solidity
error Unauthorized(string only)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| only | string | undefined |


