// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IEpochManager} from "./../../HydraChain/modules/EpochManager/IEpochManager.sol";

import {Unauthorized} from "./../../common/Errors.sol";

abstract contract EpochManagerConnector is Initializable {
    IEpochManager public epochManagerContract;

    function __EpochManagerConnector_init(address epochManagerAddr) internal onlyInitializing {
        __EpochManagerConnector_init_unchained(epochManagerAddr);
    }

    function __EpochManagerConnector_init_unchained(address epochManagerAddr) internal onlyInitializing {
        epochManagerContract = IEpochManager(epochManagerAddr);
    }

    modifier onlyEpochManager() {
        if (msg.sender != address(epochManagerContract)) {
            revert Unauthorized("ONLY_EPOCH_MANAGER");
        }

        _;
    }
}
