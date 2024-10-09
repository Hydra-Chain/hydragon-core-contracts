// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {IVestingManagerFactory} from "./IVestingManagerFactory.sol";

abstract contract VestingManagerFactoryConnector is Initializable {
    IVestingManagerFactory public vestingManagerFactoryContract;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __VestingManagerFactoryConnector_init(address vestingManagerFactoryAddr) internal onlyInitializing {
        __VestingManagerFactoryConnector_init_unchained(vestingManagerFactoryAddr);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __VestingManagerFactoryConnector_init_unchained(
        address vestingManagerFactoryAddr
    ) internal onlyInitializing {
        vestingManagerFactoryContract = IVestingManagerFactory(vestingManagerFactoryAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyVestingManagerFactory() {
        if (msg.sender != address(vestingManagerFactoryContract)) {
            revert Unauthorized("ONLY_VESTING_MANAGER_FACTORY");
        }

        _;
    }
}
