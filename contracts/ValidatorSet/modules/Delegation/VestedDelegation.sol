// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./VestFactory.sol";
import "./IVestedDelegation.sol";

error NotVestingManager();

abstract contract VestedDelegation is IVestedDelegation, VestFactory {
    /// @notice vesting manager => owner
    mapping(address => address) public vestManagers;
    /// @notice Additional mapping to store all vesting managers per user address for fast off-chain lookup
    mapping(address => address[]) public userVestManagers;

    // _______________ Modifiers _______________

    modifier onlyManager() {
        if (!isVestingManager(msg.sender)) {
            revert NotVestingManager();
        }
        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IVestedDelegation
     */
    function newManager(address rewardPool) external {
        require(msg.sender != address(0), "INVALID_OWNER");

        address managerAddr = _clone(msg.sender, rewardPool);
        storeVestManagerData(managerAddr, msg.sender);
    }

    /**
     * @inheritdoc IVestedDelegation
     */
    function getUserVestManagers(address user) external view returns (address[] memory) {
        return userVestManagers[user];
    }

    // _______________ Public functions _______________

    /**
     * @notice Claims that a delegator is a vest manager or not.
     * @param delegator Delegator's address
     */
    function isVestingManager(address delegator) public view returns (bool) {
        return vestManagers[delegator] != address(0);
    }

    // _______________ Private functions _______________

    function storeVestManagerData(address vestManager, address owner) private {
        vestManagers[vestManager] = owner;
        userVestManagers[owner].push(vestManager);
    }
}
