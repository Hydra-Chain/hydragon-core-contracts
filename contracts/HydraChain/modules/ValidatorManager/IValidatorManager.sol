// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct ValidatorInit {
    address addr;
    uint256[4] pubkey;
    uint256[2] signature;
}

enum ValidatorStatus {
    None,
    Registered,
    Active,
    Banned
}

struct Validator {
    uint256[4] blsKey;
    uint256 liquidDebt;
    ValidatorStatus status;
}

struct Uptime {
    address validator;
    uint256 signedBlocks;
}

interface IValidatorManager {
    event NewValidator(address indexed validator, uint256[4] blsKey);
    event PowerExponentUpdated(uint256 newPowerExponent);

    error InvalidSignature(address signer);
    error MaxValidatorsReached();
    error InvalidCommission(uint256 commission);
    error InvalidPowerExponent();

    /**
     * @notice Retruns bool indicating if validator is Active.
     * @param validator Address of the validator
     */
    function isValidatorActive(address validator) external view returns (bool);

    /**
     * @notice Retruns bool indicating if validator status is Registered.
     * @param validator Address of the validator
     */
    function isValidatorRegistered(address validator) external view returns (bool);

    /**
     * @notice Retruns bool indicating if validator Banned.
     * @param validator Address of the validator
     */
    function isValidatorBanned(address validator) external view returns (bool);

    /**
     * @notice Gets all validators. Returns already unactive validators as well.
     * @return Returns array of addresses
     */
    function getValidators() external view returns (address[] memory);

    // _______________ Public functions _______________

    /**
     * @notice Gets the number of current validators
     * @return Returns the count as uint256
     */
    function getActiveValidatorsCount() external view returns (uint256);

    /**
     * @notice Gets validator by address.
     * @param validator Address of the validator
     * @return blsKey BLS public key
     * @return stake self-stake
     * @return totalStake self-stake + delegation
     * @return commission validator's cut
     * @return withdrawableRewards withdrawable rewards
     * @return votingPower voting power of the validator
     * @return status status of the validator
     */
    function getValidator(
        address validator
    )
        external
        view
        returns (
            uint256[4] memory blsKey,
            uint256 stake,
            uint256 totalStake,
            uint256 commission,
            uint256 withdrawableRewards,
            uint256 votingPower,
            ValidatorStatus status
        );

    /**
     * @notice Validates BLS signature with the provided pubkey and registers validators into the set.
     * @dev Validator must be whitelisted.
     * @param signature Signature to validate message against
     * @param pubkey BLS public key of validator
     */
    function register(uint256[2] calldata signature, uint256[4] calldata pubkey) external;

    /**
     * @notice Activates validator.
     * @dev Can be called only by the staking contract.
     * @param account Address of the validator
     */
    function activateValidator(address account) external;

    /**
     * @notice Deactivates validator.
     * @dev Can be called only by the staking contract.
     * @param account Address of the validator
     */
    function deactivateValidator(address account) external;

    /**
     * @notice Sets new Voting Power Exponent Numerator.
     * @param newValue New Voting Power Exponent Numerator
     */
    function updateExponent(uint256 newValue) external;
}
