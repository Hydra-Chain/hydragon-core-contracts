// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IInspector} from "./modules/Inspector/IInspector.sol";
import {IPowerExponent} from "./modules/PowerExponent/IPowerExponent.sol";
import {IValidatorManager} from "./modules/ValidatorManager/IValidatorManager.sol";

struct Epoch {
    uint256 startBlock;
    uint256 endBlock;
    bytes32 epochRoot;
}

interface IHydraChain is IInspector, IValidatorManager, IPowerExponent {
    event NewEpoch(uint256 indexed id, uint256 indexed startBlock, uint256 indexed endBlock, bytes32 epochRoot);

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
}
