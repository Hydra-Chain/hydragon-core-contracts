// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

abstract contract Governed is AccessControlUpgradeable {
    function __Governed_init(address governer) internal onlyInitializing {
        __AccessControl_init();
        __Governed_init_unchained(governer);
    }

    function __Governed_init_unchained(address governer) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, governer);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
