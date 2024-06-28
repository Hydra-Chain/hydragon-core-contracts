// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "./../../../common/Errors.sol";
import {IEpochManager} from "./IEpochManager.sol";

abstract contract EpochManagerConnector is Initializable {
    IEpochManager public epochManagerContract;

    // _______________ Initializer _______________

    function __EpochManagerConnector_init(address epochManagerAddr) internal onlyInitializing {
        __EpochManagerConnector_init_unchained(epochManagerAddr);
    }

    function __EpochManagerConnector_init_unchained(address epochManagerAddr) internal onlyInitializing {
        epochManagerContract = IEpochManager(epochManagerAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyEpochManager() {
        if (msg.sender != address(epochManagerContract)) {
            revert Unauthorized("ONLY_EPOCH_MANAGER");
        }

        _;
    }
}
