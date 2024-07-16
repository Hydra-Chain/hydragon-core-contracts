// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "./../common/Errors.sol";
import {IHydraChain} from "./IHydraChain.sol";

abstract contract HydraChainConnector is Initializable {
    IHydraChain public hydraChainContract;

    // _______________ Initializer _______________

    function __HydraChainConnector_init(address _hydraChainAddr) internal onlyInitializing {
        __HydraChainConnector_init_unchained(_hydraChainAddr);
    }

    function __HydraChainConnector_init_unchained(address _hydraChainAddr) internal onlyInitializing {
        hydraChainContract = IHydraChain(_hydraChainAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyHydraChain() {
        if (msg.sender != address(hydraChainContract)) {
            revert Unauthorized("ONLY_HYDRA_CHAIN");
        }

        _;
    }
}
