// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import {System} from "../common/System/System.sol";
import {VestingManager} from "./VestingManager.sol";
import {IVestingManagerFactory} from "./IVestingManagerFactory.sol";

contract VestingManagerFactory is IVestingManagerFactory, System, Initializable {
    UpgradeableBeacon public beacon;

    /// @notice A vesting manager pointing to its owner
    mapping(address => address) public vestingManagerOwners;
    /// @notice Additional mapping to store all vesting managers per user address for fast off-chain lookup
    mapping(address => address[]) public userVestManagers;

    event NewVestingManager(address indexed owner, address newClone);

    // _______________ Initializer _______________

    function initialize(address hydraDelegationAddr) external initializer onlySystemCall{
        _initialize(hydraDelegationAddr);
    }

    function _initialize(address hydraDelegationAddr) internal onlyInitializing {
        address implementation = address(new VestingManager(hydraDelegationAddr));
        beacon = new UpgradeableBeacon(implementation);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IVestingManagerFactory
     */
    function isVestingManager(address account) external view returns (bool) {
        return vestingManagerOwners[account] != address(0);
    }

    /**
     * @inheritdoc IVestingManagerFactory
     */
    function getUserVestingManagers(address user) external view returns (address[] memory) {
        return userVestManagers[user];
    }

    /**
     * @inheritdoc IVestingManagerFactory
     */
    function newVestingManager() external {
        require(msg.sender != address(0), "INVALID_OWNER");

        BeaconProxy manager = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(VestingManager(address(0)).initialize.selector, msg.sender)
        );

        _storeVestManagerData(address(manager), msg.sender);

        emit NewVestingManager(msg.sender, address(manager));
    }

    // _______________ Private functions _______________

    /**
     * @notice Stores the vesting manager data
     * @param vestManager Address of the vesting manager
     * @param owner Address of the vest manager owner
     */
    function _storeVestManagerData(address vestManager, address owner) private {
        vestingManagerOwners[vestManager] = owner;
        userVestManagers[owner].push(vestManager);
    }
}
