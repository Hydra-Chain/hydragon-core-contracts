// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IHydraStaking} from "./../../../HydraStaking/IHydraStaking.sol";

import {Unauthorized} from "./../../../common/Errors.sol";

abstract contract StakingConnector is Initializable {
    IHydraStaking public stakingContract;

    // _______________ Initializer _______________

    function __StakingConnector_init(address stakingAddr) internal onlyInitializing {
        __StakingConnector_init_unchained(stakingAddr);
    }

    function __StakingConnector_init_unchained(address stakingAddr) internal onlyInitializing {
        stakingContract = IHydraStaking(stakingAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyStaking() {
        if (msg.sender != address(stakingContract)) {
            revert Unauthorized("ONLY_STAKING");
        }

        _;
    }
}
