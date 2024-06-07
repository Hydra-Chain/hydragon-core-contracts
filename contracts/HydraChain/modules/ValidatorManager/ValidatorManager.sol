// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../HydraChainBase.sol";
import "../../../common/Errors.sol";
// import "./IValidatorManager.sol";

abstract contract ValidatorManager is Initializable, HydraChainBase {

    uint256 public activeValidatorsCount;

    address[] public validatorsAddresses;

    // slither-disable-next-line naming-convention
    mapping(address => Validator) public validators;

    /**
     * @notice Mapping that keeps the last time when a validator has participated in the consensus
     * @dev Keep in mind that the validator will initially be set active when stake,
     * but it will be able to participate in the next epoch. So, the validator will have
     * less blocks to participate before getting eligible for ban.
     */
    mapping(address => uint256) public validatorParticipation;

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

    // _______________ Initializer _______________

    function __ValidatorManager_init(ValidatorInit[] calldata newValidators, uint256 initialCommission) internal onlyInitializing {
        __ValidatorManager_init_unchained(newValidators, initialCommission);
    }

    function __ValidatorManager_init_unchained(ValidatorInit[] calldata newValidators, uint256 initialCommission) internal onlyInitializing {
        epochEndBlocks.push(0);
        // set initial validators
        for (uint256 i = 0; i < newValidators.length; i++) {
            // TODO: Implement the register and stake functions from the the new Stake contract
            // _register(newValidators[i].addr, newValidators[i].signature, newValidators[i].pubkey, initialCommission);
            // _stake(newValidators[i].addr, newValidators[i].stake);
        }
    }

    // _______________ Internal functions _______________

    function _verifyValidatorRegistration(
        address signer,
        uint256[2] calldata signature,
        uint256[4] calldata pubkey
    ) internal view {
        // slither-disable-next-line calls-loop
        (bool result, bool callSuccess) = bls.verifySingle(signature, pubkey, _message(signer));
        if (!callSuccess || !result) revert InvalidSignature(signer);
    }

    /// @notice Message to sign for registration
    function _message(address signer) internal view returns (uint256[2] memory) {
        // slither-disable-next-line calls-loop
        return bls.hashToPoint(DOMAIN, abi.encodePacked(signer, block.chainid));
    }

    /**
     * @notice Method used to update the participation
     * @param validator address
     */
    function _updateParticipation(address validator) internal {
        validatorParticipation[validator] = block.number;
    }

    /**
     * @notice Method used to burn funds
     * @param amount The amount to be burned
     */
    function _burnAmount(uint256 amount) internal {
        (bool success, ) = address(0).call{value: amount}("");
        require(success, "Failed to burn amount");
    }

    /**
     * @notice Decrement the active validators count
     */
    function _decreaseActiveValidatorsCount() internal {
        activeValidatorsCount--;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
