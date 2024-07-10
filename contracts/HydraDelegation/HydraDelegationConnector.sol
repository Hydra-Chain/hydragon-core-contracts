// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IHydraDelegation} from "./IHydraDelegation.sol";

abstract contract HydraDelegationConnector is Initializable {
    IHydraDelegation public delegationContract;

    // _______________ Initializer _______________

    function __HydraDelegationConnector_init(address stakingAddr) internal onlyInitializing {
        __HydraDelegationConnector_init_unchained(stakingAddr);
    }

    function __HydraDelegationConnector_init_unchained(address stakingAddr) internal onlyInitializing {
        delegationContract = IHydraDelegation(stakingAddr);
    }
}
