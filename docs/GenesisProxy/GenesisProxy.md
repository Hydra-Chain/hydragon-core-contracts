# GenesisProxy

*Polygon Technology*

> GenesisProxy

Wrapper for OpenZeppelin&#39;s Transparent Upgradable Proxy, intended for use during genesis for genesis contractsOne GenesisProxy should be deployed for each genesis contract



## Methods

### protectSetUpProxy

```solidity
function protectSetUpProxy(address initiator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| initiator | address | undefined |

### setUpProxy

```solidity
function setUpProxy(address logic, address admin, bytes data) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| logic | address | undefined |
| admin | address | undefined |
| data | bytes | undefined |



## Events

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousAdmin  | address | undefined |
| newAdmin  | address | undefined |

### BeaconUpgraded

```solidity
event BeaconUpgraded(address indexed beacon)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beacon `indexed` | address | undefined |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



