// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import {VestingManager} from "./../../../VestingManager/VestingManager.sol";

// TODO: use different proxy design pattern, so implementation for all proxies can be changed at once
abstract contract VestingManagerFactory is Initializable {
    // base implemetantion to be used by VestManager proxies
    address public implementation;

    event NewClone(address indexed owner, address newClone);

    // _______________ Initializer _______________

    function __VestFactory_init() internal onlyInitializing {
        __VestFactory_init_unchained();
    }

    function __VestFactory_init_unchained() internal onlyInitializing {
        implementation = address(new VestingManager());
    }

    // _______________ Internal functions _______________

    function _clone(address owner) internal returns (address) {
        address child = Clones.clone(implementation);

        VestingManager(child).initialize(owner);

        emit NewClone(owner, child);

        return child;
    }
}
