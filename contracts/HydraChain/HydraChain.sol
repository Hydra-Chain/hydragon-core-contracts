// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/utils/ArraysUpgradeable.sol";

import "./HydraChainBase.sol";
import "./modules/AccessControl/AccessControl.sol";
import "./modules/PowerExponent/PowerExponent.sol";
import "./../common/System/System.sol";
import "./../common/libs/SafeMathInt.sol";

// TODO: setup use of reward account that would handle the amounts of rewards

contract HydraChain is HydraChainBase, System, AccessControl, PowerExponent {
    using ArraysUpgradeable for uint256[];

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by v3 client at genesis to set up the initial set.
     * @dev only callable by client, can only be called once
     * @param governance Governance address to set as owner of the contract
     */
    function initialize(
        address governance
    ) external initializer onlySystemCall {
        __HydraChainBase_init_unchained(newBls, newRewardPool);
        __PowerExponent_init_unchained();
        __AccessControl_init_unchained(governance);
        __Inspector_init_unchained();
    }

    //      InitStruct calldata init,
    //     ValidatorInit[] calldata newValidators,
    //     IBLS newBls,
    //     IRewardPool newRewardPool,
    //     address governance,
    //     address liquidToken,
    //     uint256 initialCommission
    // ) external initializer onlySystemCall {
    //     __ValidatorSetBase_init(newBls, newRewardPool);
    //     __PowerExponent_init();
    //     __AccessControl_init(governance);
    //     __Staking_init(init.minStake, liquidToken);
    //     __Delegation_init();
    //     __Inspector_init();
    //     __ReentrancyGuard_init();
    //     _initialize(newValidators, initialCommission);
    // }

    // function _initialize(ValidatorInit[] calldata newValidators, uint256 initialCommission) private {
    //     epochEndBlocks.push(0);
    //     // set initial validators
    //     for (uint256 i = 0; i < newValidators.length; i++) {
    //         _register(newValidators[i].addr, newValidators[i].signature, newValidators[i].pubkey, initialCommission);
    //         _stake(newValidators[i].addr, newValidators[i].stake);
    //     }
    // }

    // _______________ External functions _______________

    function commitEpoch(uint256 id, Epoch calldata epoch, uint256 epochSize) external onlySystemCall {
        uint256 newEpochId = currentEpochId++;
        require(id == newEpochId, "UNEXPECTED_EPOCH_ID");
        require(epoch.endBlock > epoch.startBlock, "NO_BLOCKS_COMMITTED");
        require((epoch.endBlock - epoch.startBlock + 1) % epochSize == 0, "EPOCH_MUST_BE_DIVISIBLE_BY_EPOCH_SIZE");
        require(epochs[newEpochId - 1].endBlock + 1 == epoch.startBlock, "INVALID_START_BLOCK");

        epochs[newEpochId] = epoch;
        _commitBlockNumbers[newEpochId] = block.number;
        epochEndBlocks.push(epoch.endBlock);

        _applyPendingExp(); // Apply new exponent in case it was changed in the latest epoch

        emit NewEpoch(id, epoch.startBlock, epoch.endBlock, epoch.epochRoot);
    }

    /**
     * @inheritdoc IHydraChain
     */
    function totalBlocks(uint256 epochId) external view returns (uint256 length) {
        uint256 endBlock = epochs[epochId].endBlock;
        length = endBlock == 0 ? 0 : endBlock - epochs[epochId].startBlock + 1;
    }

    /**
     * @inheritdoc IHydraChain
     */
    function getEpochByBlock(uint256 blockNumber) external view returns (Epoch memory) {
        uint256 epochIndex = epochEndBlocks.findUpperBound(blockNumber);
        return epochs[epochIndex];
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
