// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IRewardWallet} from "./IRewardWallet.sol";
import {Unauthorized} from "./../common/Errors.sol";
import {System} from "./../common/System/System.sol";

/**
 * @title RewardWallet
 * @dev This contract will be responsible for the rewards that will be distributed to stakers.
 * @dev It will be fulfilled with enough funds in order to be able to always have enough liqudity.
 */
contract RewardWallet is IRewardWallet, System, Initializable {
    /// @notice The mapping of the managers
    mapping(address => bool) public rewardManagers;

    // _______________ Initializer _______________

    /**
     * @notice Initializes the reward wallet with the provided addresses that will be able to distribute rewards
     * @dev The provided addresses will be other genesis contracts like the HydraStaking and HydraDelegation
     * @param managers The list of manager addresses.
     */
    function initialize(address[] calldata managers) external initializer onlySystemCall {
        _initialize(managers);
    }

    function _initialize(address[] calldata managers) internal onlyInitializing {
        for (uint256 i = 0; i < managers.length; i++) {
            rewardManagers[managers[i]] = true;
        }
    }

    // _______________ Modifiers _______________

    modifier onlyManager() {
        if (!rewardManagers[msg.sender]) {
            revert Unauthorized("ONLY_MANAGER");
        }

        _;
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IRewardWallet
     */
    function distributeReward(address to, uint256 amount) public onlyManager {
        _distributeReward(to, amount);
    }

    // _______________ Internal functions _______________

    function _distributeReward(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        require(success, "DISTRIBUTE_FAILED");

        emit RewardDistributed(to, amount);
    }

    /**
     * @notice Users can send HYDRA to the contract.
     * @dev Sender will usually be the node, but anyone can send funds.
     */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
