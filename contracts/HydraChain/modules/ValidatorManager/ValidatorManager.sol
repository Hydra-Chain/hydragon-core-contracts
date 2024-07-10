// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "./../../../common/System/System.sol";
import {AccessControl} from "../AccessControl/AccessControl.sol";
import {StakingConnector} from "./../Connectors/StakingConnector.sol";
import {DelegationConnector} from "./../Connectors/DelegationConnector.sol";
import {Unauthorized} from "../../../common/Errors.sol";
import {IBLS} from "./../../../BLS/IBLS.sol";
import {IValidatorManager, Validator, ValidatorInit, ValidatorStatus} from "./IValidatorManager.sol";

abstract contract ValidatorManager is IValidatorManager, System, AccessControl, StakingConnector, DelegationConnector {
    bytes32 public constant DOMAIN = keccak256("DOMAIN_HYDRA_CHAIN");

    /// @notice A constant for the maximum amount of validators
    uint256 public constant MAX_VALIDATORS = 150;

    IBLS public bls;
    address[] public validatorsAddresses;
    uint256 public activeValidatorsCount;
    // slither-disable-next-line naming-convention
    mapping(address => Validator) public validators;
    /**
     * @notice Mapping that keeps the last time when a validator has participated in the consensus
     * @dev Keep in mind that the validator will initially be set active when stake,
     * but it will be able to participate in the next epoch. So, the validator will have
     * less blocks to participate before getting eligible for ban.
     */
    mapping(address => uint256) public validatorsParticipation;

    // _______________ Initializer _______________

    // TODO: Move commision to Delegation module
    function __ValidatorManager_init(
        ValidatorInit[] calldata _newValidators,
        IBLS _newBls,
        address _stakingContractAddr,
        address _delegationContractAddr,
        address _governance
    ) internal onlyInitializing {
        __AccessControl_init(_governance);
        __StakingConnector_init(_stakingContractAddr);
        __DelegationConnector_init(_delegationContractAddr);
        __ValidatorManager_init_unchained(_newValidators, _newBls);
    }

    function __ValidatorManager_init_unchained(
        ValidatorInit[] calldata newValidators,
        IBLS newBls
    ) internal onlyInitializing {
        bls = newBls;
        // set initial validators
        for (uint256 i = 0; i < newValidators.length; i++) {
            _register(newValidators[i].addr, newValidators[i].signature, newValidators[i].pubkey);
        }
    }

    // _______________ Modifiers _______________

    modifier onlyActiveValidator(address validator) {
        if (validators[validator].status != ValidatorStatus.Active) revert Unauthorized("INACTIVE_VALIDATOR");
        _;
    }

    /// @notice Modifier to check if the validator is registered or active
    modifier onlyValidator(address validator) {
        if (
            validators[validator].status != ValidatorStatus.Registered &&
            validators[validator].status != ValidatorStatus.Active
        ) revert Unauthorized("INVALID_VALIDATOR");
        _;
    }

    // _______________ External functions _______________


    /**
     * @inheritdoc IValidatorManager
     */
    function isValidatorActive(address validator) external view returns (bool) {
        return validators[validator].status == ValidatorStatus.Active;
    }

    /**
     * @inheritdoc IValidatorManager
     */
    function isValidatorRegistered(address validator) external view returns (bool) {
        return validators[validator].status == ValidatorStatus.Registered;
    }

    /**
     * @inheritdoc IValidatorManager
     */
    function getValidators() external view returns (address[] memory) {
        return validatorsAddresses;
    }

    /**
     * @inheritdoc IValidatorManager
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
        totalStake = stakingContract.totalBalanceOf(validatorAddress);
        stake = stakingContract.stakeOf(validatorAddress);
        commission = delegationContract.stakerDelegationCommission(validatorAddress);
        withdrawableRewards = stakingContract.unclaimedRewards(validatorAddress);
        active = v.status == ValidatorStatus.Active;
    }

    /**
     * @inheritdoc IValidatorManager
     */
    function register(uint256[2] calldata signature, uint256[4] calldata pubkey) external {
        if (!AccessControl.isWhitelisted[msg.sender]) revert Unauthorized("WHITELIST");
        if (validators[msg.sender].status != ValidatorStatus.None) revert Unauthorized("ALREADY_REGISTERED");

        _register(msg.sender, signature, pubkey);

        emit NewValidator(msg.sender, pubkey);
    }

    function activateValidator(address account) external onlyStaking {
        if (getActiveValidatorsCount() == MAX_VALIDATORS) revert MaxValidatorsReached();
        if (validators[account].status != ValidatorStatus.Registered) revert Unauthorized("MUST_BE_REGISTERED");
        unchecked {
            activeValidatorsCount++;
        }

        validators[account].status = ValidatorStatus.Active;
        // activation moment is set as first participation
        _updateParticipation(account);
    }

    function deactivateValidator(address account) external onlyStaking {
        validators[account].status = ValidatorStatus.Registered;
        activeValidatorsCount--;
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IValidatorManager
     */
    function getActiveValidatorsCount() public view returns (uint256) {
        return activeValidatorsCount;
    }

    // _______________ Internal functions _______________

    /**
     * @notice Method used to update the participation
     * @param validator address
     */
    function _updateParticipation(address validator) internal {
        validatorsParticipation[validator] = block.number;
    }

    // _______________ Private functions _______________

    function _register(address validator, uint256[2] calldata signature, uint256[4] calldata pubkey) private {
        _verifyValidatorRegistration(validator, signature, pubkey);
        validators[validator].blsKey = pubkey;
        validators[validator].status = ValidatorStatus.Registered;
        validatorsAddresses.push(validator);
        // TODO: Create delegation pool if desired
    }

    function _verifyValidatorRegistration(
        address signer,
        uint256[2] calldata signature,
        uint256[4] calldata pubkey
    ) private view {
        // slither-disable-next-line calls-loop
        (bool result, bool callSuccess) = bls.verifySingle(signature, pubkey, _message(signer));
        if (!callSuccess || !result) revert InvalidSignature(signer);
    }

    /// @notice Message to sign for registration
    function _message(address signer) private view returns (uint256[2] memory) {
        // slither-disable-next-line calls-loop
        return bls.hashToPoint(DOMAIN, abi.encodePacked(signer, block.chainid));
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
