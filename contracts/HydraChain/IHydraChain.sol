// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IInspector} from "./modules/Inspector/IInspector.sol";
import {IPowerExponent} from "./modules/PowerExponent/IPowerExponent.sol";
import {IDaoIncentive} from "./modules/DaoIncentive/IDaoIncentive.sol";
import {IValidatorManager} from "./modules/ValidatorManager/IValidatorManager.sol";
import {Uptime} from "./modules/ValidatorManager/IValidatorManager.sol";

struct Epoch {
    uint256 startBlock;
    uint256 endBlock;
    bytes32 epochRoot;
}

interface IHydraChain is IInspector, IValidatorManager, IPowerExponent, IDaoIncentive {
    event NewEpoch(uint256 indexed id, uint256 indexed startBlock, uint256 indexed endBlock, bytes32 epochRoot);

    /**
     * @notice Get current epoch ID
     */
    function getCurrentEpochId() external view returns (uint256);

    /**
     * @notice Total amount of blocks in a given epoch
     * @param epochId The number of the epoch
     * @return length Total blocks for an epoch
     */
    function totalBlocks(uint256 epochId) external view returns (uint256 length);

    /**
     * @notice Look up an epoch by block number. Searches in O(log n) time.
     * @param blockNumber ID of epoch to be committed
     * @return Epoch Returns epoch if found, or else, the last epoch
     */
    function getEpochByBlock(uint256 blockNumber) external view returns (Epoch memory);

    /**
     * @notice Commits an epoch
     * @dev Only callable by the system
     * @param id The number of the epoch
     * @param epoch The epoch to be committed
     * @param epochSize Number of blocks per epoch
     * @param uptime uptime data for every validator
     */
    function commitEpoch(uint256 id, Epoch calldata epoch, uint256 epochSize, Uptime[] calldata uptime) external;
}
