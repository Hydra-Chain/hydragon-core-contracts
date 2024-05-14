// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/utils/ArraysUpgradeable.sol";

import "./ValidatorSetBase.sol";
import "./modules/AccessControl/AccessControl.sol";
import "./modules/PowerExponent/PowerExponent.sol";
import "./modules/Staking/Staking.sol";
import "./modules/Delegation/Delegation.sol";
import "./modules/Inspector/Inspector.sol";
import "./../common/System/System.sol";

import "./../common/libs/SafeMathInt.sol";

// TODO: setup use of reward account that would handle the amounts of rewards

contract ValidatorSet is ValidatorSetBase, System, AccessControl, PowerExponent, Staking, Delegation, Inspector {
    using ArraysUpgradeable for uint256[];

    /// @notice Epoch data linked with the epoch id
    mapping(uint256 => Epoch) public epochs;
    /// @notice Array with epoch ending blocks
    uint256[] public epochEndBlocks;

    // _______________ Modifiers _______________

    modifier onlyRewardPool() {
        if (msg.sender != address(rewardPool)) revert Unauthorized("REWARD_POOL");
        _;
    }

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by v3 client at genesis to set up the initial set.
     * @dev only callable by client, can only be called once
     * @param init: newEpochReward reward for a proposed epoch
     *              newMinStake minimum stake to become a validator
     * @param newValidators: addr addresses of initial validators
     *                    pubkey uint256[4] BLS public keys of initial validators
     *                    signature uint256[2] signature of initial validators
     *                    stake amount staked per initial validator
     * @param newBls address of BLS contract/precompile
     * @param governance Governance address to set as owner of the contract
     */
    function initialize(
        InitStruct calldata init,
        ValidatorInit[] calldata newValidators,
        IBLS newBls,
        IRewardPool newRewardPool,
        address governance,
        address liquidToken,
        uint256 initialCommission
    ) external initializer onlySystemCall {
        __ValidatorSetBase_init(newBls, newRewardPool);
        __PowerExponent_init();
        __AccessControl_init(governance);
        __Staking_init(init.minStake, liquidToken);
        __Delegation_init();
        __Inspector_init();
        __ReentrancyGuard_init();
        _initialize(newValidators, initialCommission);
    }

    function _initialize(ValidatorInit[] calldata newValidators, uint256 initialCommission) private {
        epochEndBlocks.push(0);
        // set initial validators
        for (uint256 i = 0; i < newValidators.length; i++) {
            _register(newValidators[i].addr, newValidators[i].signature, newValidators[i].pubkey, initialCommission);
            _stake(newValidators[i].addr, newValidators[i].stake);
        }
    }

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
     * @notice Get the validator by its address
     * @param validatorAddress address
     */
    function getValidator(
        address validatorAddress
    )
        external
        view
        returns (
            uint256[4] memory blsKey,
            uint256 stake,
            uint256 totalStake,
            uint256 commission,
            uint256 withdrawableRewards,
            bool active
        )
    {
        Validator memory v = validators[validatorAddress];
        blsKey = v.blsKey;
        totalStake = balanceOf(validatorAddress);
        stake = totalStake - rewardPool.totalDelegationOf(validatorAddress);
        commission = v.commission;
        withdrawableRewards = rewardPool.getValidatorReward(validatorAddress);
        active = v.status == ValidatorStatus.Registered;
    }

    /**
     * @inheritdoc IValidatorSet
     */
    function getValidators() public view returns (address[] memory) {
        return validatorsAddresses;
    }

    /**
     * @inheritdoc IValidatorSet
     */
    function totalBlocks(uint256 epochId) external view returns (uint256 length) {
        uint256 endBlock = epochs[epochId].endBlock;
        length = endBlock == 0 ? 0 : endBlock - epochs[epochId].startBlock + 1;
    }

    /**
     * @inheritdoc IValidatorSet
     */
    function getEpochByBlock(uint256 blockNumber) external view returns (Epoch memory) {
        uint256 epochIndex = epochEndBlocks.findUpperBound(blockNumber);
        return epochs[epochIndex];
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
