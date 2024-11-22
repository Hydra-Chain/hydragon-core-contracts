// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {Unauthorized} from "../Errors.sol";

abstract contract Governed is AccessControlUpgradeable {
    // solhint-disable-next-line func-name-mixedcase
    function __Governed_init(address governance) internal onlyInitializing {
        __AccessControl_init();
        __Governed_init_unchained(governance);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Governed_init_unchained(address governance) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, governance);
    }

    // _______________ Modifiers _______________

    modifier onlyGovernance() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert Unauthorized("GOVERNANCE_ONLY");
        }

        _;
    }

    // _______________ Internal functions _______________

    function _isGovernance(address account) internal view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
