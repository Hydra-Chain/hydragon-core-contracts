// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {IHydraDelegation} from "./IHydraDelegation.sol";

abstract contract HydraDelegationConnector is Initializable {
    IHydraDelegation public hydraDelegationContract;

    // _______________ Initializer _______________

    function __HydraDelegationConnector_init(address _hydraDelegationAddr) internal onlyInitializing {
        __HydraDelegationConnector_init_unchained(_hydraDelegationAddr);
    }

    function __HydraDelegationConnector_init_unchained(address _hydraDelegationAddr) internal onlyInitializing {
        hydraDelegationContract = IHydraDelegation(_hydraDelegationAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyHydraDelegation() {
        if (msg.sender != address(hydraDelegationContract)) {
            revert Unauthorized("ONLY_HYDRA_DELEGATION");
        }

        _;
    }
}
