// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

abstract contract Governed is AccessControlUpgradeable {
    function __Governed_init(address governance) internal onlyInitializing {
        __AccessControl_init();
        __Governed_init_unchained(governance);
    }

    function __Governed_init_unchained(address governance) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, governance);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
