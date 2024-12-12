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
    mapping(address => address) public vestingManagerOwner;
    /// @notice Additional mapping to store all vesting managers per user address for fast off-chain lookup
    mapping(address => address[]) public userVestingManagers;

    // _______________ Initializer _______________

    function initialize(address hydraDelegationAddr, address liquidityTokenAddr) external initializer onlySystemCall {
        _initialize(hydraDelegationAddr, liquidityTokenAddr);
    }

    function _initialize(address hydraDelegationAddr, address liquidityTokenAddr) internal onlyInitializing {
        address implementation = address(new VestingManager(hydraDelegationAddr, liquidityTokenAddr));
        beacon = new UpgradeableBeacon(implementation);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IVestingManagerFactory
     */
    function newVestingManager() external {
        if (msg.sender == address(0)) {
            revert InvalidOwner();
        }

        BeaconProxy manager = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(VestingManager.initialize.selector, msg.sender)
        );

        _storeVestingManagerData(address(manager), msg.sender);

        emit NewVestingManager(msg.sender, address(manager));
    }

    /**
     * @inheritdoc IVestingManagerFactory
     */
    function isVestingManager(address account) external view returns (bool) {
        return vestingManagerOwner[account] != address(0);
    }

    /**
     * @inheritdoc IVestingManagerFactory
     */
    function getUserVestingManagers(address user) external view returns (address[] memory) {
        return userVestingManagers[user];
    }

    // _______________ Private functions _______________

    /**
     * @notice Stores the vesting manager data
     * @param vestingManager Address of the vesting manager
     * @param owner Address of the vest manager owner
     */
    function _storeVestingManagerData(address vestingManager, address owner) private {
        vestingManagerOwner[vestingManager] = owner;
        userVestingManagers[owner].push(vestingManager);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
