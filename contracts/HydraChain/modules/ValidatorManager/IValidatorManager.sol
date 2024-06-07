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
    Whitelisted,
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

    /**
     * @notice Returns the total balance of a given validator
     * @param account The address of the validator
     * @return Validator's balance
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Returns the total supply
     * @return Total supply
     */
    function totalSupply() external view returns (uint256);

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
     * @notice Method to update when the validator was lastly active which can be executed only by the RewardPool
     * @param validator The validator to set the last participation for
     */
    function updateValidatorParticipation(address validator) external;
}