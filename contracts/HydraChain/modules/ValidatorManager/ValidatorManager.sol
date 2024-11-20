// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {Unauthorized} from "../../../common/Errors.sol";
import {HydraStakingConnector} from "../../../HydraStaking/HydraStakingConnector.sol";
import {HydraDelegationConnector} from "../../../HydraDelegation/HydraDelegationConnector.sol";
import {IBLS} from "../../../BLS/IBLS.sol";
import {Whitelisting} from "../Whitelisting/Whitelisting.sol";
import {IValidatorManager, Validator, ValidatorInit, ValidatorStatus} from "./IValidatorManager.sol";

abstract contract ValidatorManager is
    IValidatorManager,
    System,
    Initializable,
    Whitelisting,
    HydraStakingConnector,
    HydraDelegationConnector
{
    bytes32 public constant DOMAIN = keccak256("DOMAIN_HYDRA_CHAIN");
    /// @notice A constant for the maximum amount of validators
    uint256 public constant MAX_VALIDATORS = 150;

    IBLS public bls;
    address[] public validatorsAddresses;
    uint256 public activeValidatorsCount;
    /**
     * @notice `powerExponent` represents the numerator of the Voting Power Exponent, where the denominator is 10,000.
     * The Voting Power Exponent is a fractional value between 0.5 and 1, used to exponentially decrease
     * the voting power of a validator. This mechanism encourages better decentralization of the network.
     */
    uint256 public powerExponent;
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

    // solhint-disable-next-line func-name-mixedcase
    function __ValidatorManager_init(
        ValidatorInit[] calldata _newValidators,
        IBLS _newBls,
        address _hydraDelegationAddr,
        address _governance
    ) internal onlyInitializing {
        __Whitelisting_init(_governance);
        __HydraDelegationConnector_init(_hydraDelegationAddr);
        __ValidatorManager_init_unchained(_newValidators, _newBls);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __ValidatorManager_init_unchained(
        ValidatorInit[] calldata newValidators,
        IBLS newBls
    ) internal onlyInitializing {
        bls = newBls;
        powerExponent = 5000;
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
    function register(uint256[2] calldata signature, uint256[4] calldata pubkey) external onlyWhitelisted {
        if (validators[msg.sender].status != ValidatorStatus.None) revert Unauthorized("ALREADY_REGISTERED");

        _register(msg.sender, signature, pubkey);

        emit NewValidator(msg.sender, pubkey);
    }

    /**
     * @inheritdoc IValidatorManager
     */
    function activateValidator(address account) external onlyHydraStaking {
        if (getActiveValidatorsCount() == MAX_VALIDATORS) revert MaxValidatorsReached();
        if (validators[account].status != ValidatorStatus.Registered) revert Unauthorized("MUST_BE_REGISTERED");
        unchecked {
            activeValidatorsCount++;
        }

        validators[account].status = ValidatorStatus.Active;
        // activation moment is set as first participation
        _updateParticipation(account);
    }

    /**
     * @inheritdoc IValidatorManager
     */
    function deactivateValidator(address account) external onlyHydraStaking {
        assert(validators[account].status == ValidatorStatus.Active);
        validators[account].status = ValidatorStatus.Registered;
        activeValidatorsCount--;
    }

    /**
     * @inheritdoc IValidatorManager
     */
    function updateExponent(uint256 newValue) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newValue < 5000 || newValue > 10000) {
            revert InvalidPowerExponent(); // must be 0.5 <= Exponent <= 1
        }

        powerExponent = newValue;

        emit PowerExponentUpdated(newValue);
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
    function isValidatorBanned(address validator) external view returns (bool) {
        return validators[validator].status == ValidatorStatus.Banned;
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

    /**
     * @notice Gets validator by address.
     * @param validator Address of the validator
     * @return blsKey BLS public key
     * @return stake self-stake
     * @return totalStake self-stake + delegation
     * @return commission validator's cut
     * @return withdrawableRewards withdrawable rewards
     * @return status status of the validator
     */
    function _getValidator(
        address validator
    )
        internal
        view
        returns (
            uint256[4] memory blsKey,
            uint256 stake,
            uint256 totalStake,
            uint256 commission,
            uint256 withdrawableRewards,
            ValidatorStatus status
        )
    {
        Validator memory v = validators[validator];
        blsKey = v.blsKey;
        stake = hydraStakingContract.stakeOf(validator);
        totalStake = hydraStakingContract.totalBalanceOf(validator);
        commission = hydraDelegationContract.stakerDelegationCommission(validator);
        withdrawableRewards = hydraStakingContract.unclaimedRewards(validator);
        status = v.status;
    }

    // _______________ Private functions _______________

    function _register(address validator, uint256[2] calldata signature, uint256[4] calldata pubkey) private {
        _verifyValidatorRegistration(validator, signature, pubkey);
        validators[validator].blsKey = pubkey;
        validators[validator].status = ValidatorStatus.Registered;
        validatorsAddresses.push(validator);
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
