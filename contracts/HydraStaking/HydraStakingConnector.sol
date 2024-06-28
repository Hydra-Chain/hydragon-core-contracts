// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "./../common/Errors.sol";
import {IHydraStaking} from "./IHydraStaking.sol";

abstract contract HydraStakingConnector is Initializable {
    IHydraStaking public hydraStakingContract;

    // _______________ Initializer _______________

    function __HydraStakingConnector_init(address hydraStakingAddr) internal onlyInitializing {
        __HydraStakingConnector_init_unchained(hydraStakingAddr);
    }

    function __HydraStakingConnector_init_unchained(address hydraStakingAddr) internal onlyInitializing {
        hydraStakingContract = IHydraStaking(hydraStakingAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyHydraStaking() {
        if (msg.sender != address(hydraStakingContract)) {
            revert Unauthorized("ONLY_HYDRA_STAKING");
        }

        _;
    }
}
