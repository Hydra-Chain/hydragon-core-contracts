// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct ValidatorInit {
    address addr;
    uint256[4] pubkey;
    uint256[2] signature;
    uint256 stake;
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
    uint256 commission;
    ValidatorStatus status;
}

interface IValidatorManager {
    event NewValidator(address indexed validator, uint256[4] blsKey);
    event CommissionUpdated(address indexed validator, uint256 newCommission);

    error InvalidSignature(address signer);
    error MaxValidatorsReached();
    error InvalidCommission(uint256 commission);

    /**
     * @notice Validates BLS signature with the provided pubkey and registers validators into the set.
     * @param signature Signature to validate message against
     * @param pubkey BLS public key of validator
     * @param commission The commission rate for the delegators
     */
    function register(uint256[2] calldata signature, uint256[4] calldata pubkey, uint256 commission) external;

    function activateValidator(address account) external;

    function deactivateValidator(address account) external;

    /**
     * @notice Gets validator by address.
     * @param validator Address of the validator
     * @return blsKey BLS public key
     * @return stake self-stake
     * @return totalStake self-stake + delegation
     * @return commission
     * @return withdrawableRewards withdrawable rewards
     * @return active activity status
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
            bool active
        );

    /**
     * @notice Gets all validators. Returns already unactive validators as well.
     * @return Returns array of addresses
     */
    function getValidators() external view returns (address[] memory);

    /**
     * @notice Gets the number of current validators
     * @return Returns the count as uint256
     */
    function getActiveValidatorsCount() external view returns (uint256);

    /**
     * @notice Sets commission for validator.
     * @param newCommission New commission (100 = 100%)
     */
    function setCommission(uint256 newCommission) external;
}
