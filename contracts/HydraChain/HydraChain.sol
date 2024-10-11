// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ArraysUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ArraysUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {IBLS} from "../BLS/IBLS.sol";
import {HydraStakingConnector} from "../HydraStaking/HydraStakingConnector.sol";
import {Inspector} from "./modules/Inspector/Inspector.sol";
import {ValidatorsData} from "./modules/ValidatorsData/ValidatorsData.sol";
import {ValidatorManager, ValidatorInit, ValidatorStatus, Validator} from "./modules/ValidatorManager/ValidatorManager.sol";
import {IValidatorsData} from "./modules/ValidatorsData/IValidatorsData.sol";
import {DaoIncentive} from "./modules/DaoIncentive/DaoIncentive.sol";
import {Uptime, IValidatorManager} from "./modules/ValidatorManager/IValidatorManager.sol";
import {IHydraChain} from "./IHydraChain.sol";
import {Epoch} from "./IHydraChain.sol";

contract HydraChain is
    IHydraChain,
    Ownable2StepUpgradeable,
    HydraStakingConnector,
    ValidatorManager,
    Inspector,
    DaoIncentive,
    ValidatorsData
{
    using ArraysUpgradeable for uint256[];

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
        address daoIncentiveVaultAddr,
        IBLS newBls
    ) external initializer onlySystemCall {
        __Ownable2Step_init();
        __HydraStakingConnector_init(hydraStakingAddr);
        __DaoIncentive_init(aprCalculatorAddr, rewardWalletAddr, daoIncentiveVaultAddr);
        __ValidatorManager_init(newValidators, newBls, hydraDelegationAddr, governance);
        __Inspector_init();

        _initialize();
    }

    function _initialize() private {
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
        if (id != newEpochId) {
            revert CommitEpochFailed("UNEXPECTED_EPOCH_ID");
        }
        if (epoch.startBlock >= epoch.endBlock) {
            revert CommitEpochFailed("NO_BLOCKS_COMMITTED");
        }
        if ((epoch.endBlock - epoch.startBlock + 1) % epochSize != 0) {
            revert CommitEpochFailed("EPOCH_MUST_BE_DIVISIBLE_BY_EPOCH_SIZE");
        }
        if (epochs[newEpochId - 1].endBlock + 1 != epoch.startBlock) {
            revert CommitEpochFailed("INVALID_START_BLOCK");
        }

        epochs[newEpochId] = epoch;
        _commitBlockNumbers[newEpochId] = block.number;
        epochEndBlocks.push(epoch.endBlock);

        // Update participations
        uint256 uptimesCount = uptime.length;
        for (uint256 i = 0; i < uptimesCount; i++) {
            _updateParticipation(uptime[i].validator);
        }

        emit NewEpoch(id, epoch.startBlock, epoch.endBlock, epoch.epochRoot);
    }

    /**
     * @inheritdoc ValidatorManager
     */
    function getValidator(
        address validatorAddress
    )
        external
        view
        override(ValidatorManager, IValidatorManager)
        returns (
            uint256[4] memory blsKey,
            uint256 stake,
            uint256 totalStake,
            uint256 commission,
            uint256 withdrawableRewards,
            uint256 votingPower,
            ValidatorStatus status
        )
    {
        Validator memory v = validators[validatorAddress];
        blsKey = v.blsKey;
        stake = hydraStakingContract.stakeOf(validatorAddress);
        totalStake = hydraStakingContract.totalBalanceOf(validatorAddress);
        commission = hydraDelegationContract.stakerDelegationCommission(validatorAddress);
        withdrawableRewards = hydraStakingContract.unclaimedRewards(validatorAddress);
        votingPower = validatorPower[validatorAddress];
        status = v.status;
    }

    // _______________ Public functions _______________

    /**
     * @notice Returns if a given validator is subject to a ban
     * @dev Apply custom rules for ban eligibility
     * @param validator The address of the validator
     * @return Returns true if the validator is subject to a ban
     */
    function isSubjectToBan(address validator) public view override returns (bool) {
        // check if the owner (governance) is calling or the validator is already subject to ban on previous exit
        if (msg.sender == owner()) {
            return true;
        }

        uint256 lastCommittedEndBlock = _commitBlockNumbers[currentEpochId - 1];
        uint256 validatorParticipation = validatorsParticipation[validator];
        // check if the validator is active and the last participation is less than the threshold
        if (
            validators[validator].status == ValidatorStatus.Active &&
            lastCommittedEndBlock > validatorParticipation &&
            lastCommittedEndBlock - validatorParticipation >= banThreshold
        ) {
            return true;
        }

        return false;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
