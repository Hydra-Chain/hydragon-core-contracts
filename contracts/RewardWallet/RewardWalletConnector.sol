// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IRewardWallet} from "./IRewardWallet.sol";
import {Unauthorized} from "./../common/Errors.sol";

abstract contract RewardWalletConnector is Initializable {
    IRewardWallet public rewardWalletContract;

    // _______________ Initializer _______________

    function __RewardWalletConnector_init(address _rewardWalletAddr) internal onlyInitializing {
        __RewardWalletConnector_init_unchained(_rewardWalletAddr);
    }

    function __RewardWalletConnector_init_unchained(address _rewardWalletAddr) internal onlyInitializing {
        rewardWalletContract = IRewardWallet(_rewardWalletAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyRewardWallet() {
        if (msg.sender != address(rewardWalletContract)) {
            revert Unauthorized("ONLY_REWARD_WALLET");
        }

        _;
    }
}
