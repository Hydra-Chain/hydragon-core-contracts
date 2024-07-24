// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ArraysUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ArraysUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {IBLS} from "../BLS/IBLS.sol";
import {System} from "../common/System/System.sol";
import {SafeMathInt} from "../common/libs/SafeMathInt.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {RewardWalletConnector} from "../RewardWallet/RewardWalletConnector.sol";
import {Inspector} from "./modules/Inspector/Inspector.sol";
import {PowerExponent} from "./modules/PowerExponent/PowerExponent.sol";
import {ValidatorManager, ValidatorInit} from "./modules/ValidatorManager/ValidatorManager.sol";
import {Uptime} from "./modules/ValidatorManager/IValidatorManager.sol";
import {IHydraChain} from "./IHydraChain.sol";
import {Epoch} from "./IHydraChain.sol";

contract HydraChain is
    IHydraChain,
    Ownable2StepUpgradeable,
    ValidatorManager,
    Inspector,
    PowerExponent,
    APRCalculatorConnector,
    RewardWalletConnector
{
    using ArraysUpgradeable for uint256[];

    address public hydraVault;
    uint256 public currentEpochId;
    /// @notice Epoch data linked with the epoch id
    mapping(uint256 => Epoch) public epochs;
    /// @notice Array with epoch ending blocks
    uint256[] public epochEndBlocks;

    mapping(uint256 => uint256) internal _commitBlockNumbers;

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by the Hydra client at genesis to set up the initial state.
     * @dev only callable by client, can only be called once
     */
    function initialize(
        ValidatorInit[] calldata newValidators,
        address governance,
        address hydraStakingAddr,
        address hydraDelegationAddr,
        address aprCalculatorAddr,
        address rewardWalletAddr,
        address hydraVaultAddr,
        IBLS newBls
    ) external initializer onlySystemCall {
        __Ownable2Step_init();
        __APRCalculatorConnector_init(aprCalculatorAddr);
        __RewardWalletConnector_init(rewardWalletAddr);
        __ValidatorManager_init(newValidators, newBls, hydraStakingAddr, hydraDelegationAddr, governance);
        __Inspector_init();
        __PowerExponent_init();

        _initialize(hydraVaultAddr);
    }

    function _initialize(address hydraVaultAddr) private {
        hydraVault = hydraVaultAddr;
        currentEpochId = 1;
        epochEndBlocks.push(0);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IHydraChain
     */
    function getCurrentEpochId() external view returns (uint256) {
        return currentEpochId;
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

    /**
     * @inheritdoc IHydraChain
     */
    function commitEpoch(
        uint256 id,
        Epoch calldata epoch,
        uint256 epochSize,
        Uptime[] calldata uptime
    ) external onlySystemCall {
        uint256 newEpochId = currentEpochId++;
        require(id == newEpochId, "UNEXPECTED_EPOCH_ID");
        require(epoch.endBlock > epoch.startBlock, "NO_BLOCKS_COMMITTED");
        require((epoch.endBlock - epoch.startBlock + 1) % epochSize == 0, "EPOCH_MUST_BE_DIVISIBLE_BY_EPOCH_SIZE");
        require(epochs[newEpochId - 1].endBlock + 1 == epoch.startBlock, "INVALID_START_BLOCK");

        epochs[newEpochId] = epoch;
        _commitBlockNumbers[newEpochId] = block.number;
        epochEndBlocks.push(epoch.endBlock);

        _applyPendingExp(); // Apply new exponent in case it was changed in the latest epoch

        // Update participations
        uint256 uptimesCount = uptime.length;
        for (uint256 i = 0; i < uptimesCount; i++) {
            _updateParticipation(uptime[i].validator);
        }

        _distributeVaultFunds();

        emit NewEpoch(id, epoch.startBlock, epoch.endBlock, epoch.epochRoot);
    }

    // _______________ Public functions _______________

    /**
     * @notice Returns if a given validator is subject to a ban
     * @dev Apply custom rules for ban eligibility
     * @param validator The address of the validator
     * @return Returns true if the validator is subject to a ban
     */
    function isSubjectToBan(address validator) public view override returns (bool) {
        uint256 lastCommittedEndBlock = epochs[currentEpochId - 1].endBlock;
        // check if the threshold is reached when the method is not executed by the owner (governance)
        if (msg.sender != owner() && lastCommittedEndBlock - validatorsParticipation[validator] < banThreshold) {
            return false;
        }

        return true;
    }

    // _______________ Private functions _______________

    function _distributeVaultFunds() private {
        uint256 epochsPerYear;
        uint256 reward;
        try aprCalculatorContract.getEpochsPerYear() returns (uint256 _epochsPerYear) {
            epochsPerYear = _epochsPerYear;
        } catch Error(string memory reason) {
            emit VaultFunded(currentEpochId, 0, reason, "");
            return;
        } catch (bytes memory lowLevelData) {
            emit VaultFunded(currentEpochId, 0, "", lowLevelData);
            return;
        }

        try hydraStakingContract.totalBalance() returns (uint256 _totalBalance) {
            if (epochsPerYear == 0) {
                return;
            }
            reward = (_totalBalance * 200) / 10000 / epochsPerYear;
        } catch Error(string memory reason) {
            emit VaultFunded(currentEpochId, 0, reason, "");
            return;
        } catch (bytes memory lowLevelData) {
            emit VaultFunded(currentEpochId, 0, "", lowLevelData);
            return;
        }

        try rewardWalletContract.distributeReward(hydraVault, reward) {
            emit VaultFunded(currentEpochId, reward, "", "");
        } catch Error(string memory reason) {
            emit VaultFunded(currentEpochId, reward, reason, "");
            return;
        } catch (bytes memory lowLevelData) {
            emit VaultFunded(currentEpochId, reward, "", lowLevelData);
            return;
        }
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
