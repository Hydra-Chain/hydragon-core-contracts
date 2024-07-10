// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IHydraDelegation} from "./../../../HydraDelegation/IHydraDelegation.sol";

abstract contract DelegationConnector is Initializable {
    IHydraDelegation public delegationContract;

    // _______________ Initializer _______________

    function __DelegationConnector_init(address stakingAddr) internal onlyInitializing {
        __DelegationConnector_init_unchained(stakingAddr);
    }

    function __DelegationConnector_init_unchained(address stakingAddr) internal onlyInitializing {
        delegationContract = IHydraDelegation(stakingAddr);
    }
}
