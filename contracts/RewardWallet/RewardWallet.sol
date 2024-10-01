// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {IRewardWallet} from "./IRewardWallet.sol";

/**
 * @title RewardWallet
 * @dev This contract will be responsible for the rewards that will be distributed to stakers.
 * It will be fulfilled with enough funds in order to be able to always have enough liqudity.
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

    function _initialize(address[] calldata managers) private onlyInitializing {
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

    /**
     * @notice Method used to fund the contract with HYDRA.
     * @dev This function is used to prevent modifications to the node's logic for systems transactions,
     * which currently require an input. Since the `receive` function cannot be taken as an input there,
     * we have decided to create this new function.
     */
    function fund() public payable {
        emit Received(msg.sender, msg.value);
    }

    // _______________ Internal functions _______________

    function _distributeReward(address to, uint256 amount) internal {
        // slither-disable-next-line arbitrary-send-eth
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert DistributionFailed();

        emit RewardDistributed(to, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
