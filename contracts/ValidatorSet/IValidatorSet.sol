// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct ValidatorInit {
    address addr;
    uint256[4] pubkey;
    uint256[2] signature;
    uint256 stake;
}

struct InitStruct {
    uint256 epochReward;
    uint256 minStake;
    uint256 epochSize;
}

struct Epoch {
    uint256 startBlock;
    uint256 endBlock;
    bytes32 epochRoot;
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

interface IValidatorSet {
    event NewEpoch(uint256 indexed id, uint256 indexed startBlock, uint256 indexed endBlock, bytes32 epochRoot);

    /**
     * @notice Total amount of blocks in a given epoch
     * @param epochId The number of the epoch
     * @return length Total blocks for an epoch
     */
    function totalBlocks(uint256 epochId) external view returns (uint256 length);

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
     * @notice Look up an epoch by block number. Searches in O(log n) time.
     * @param blockNumber ID of epoch to be committed
     * @return Epoch Returns epoch if found, or else, the last epoch
     */
    function getEpochByBlock(uint256 blockNumber) external view returns (Epoch memory);

    /**
     * @notice Gets all validators. Returns already unactive validators as well.
     * @return Returns array of addresses
     */
    function getValidators() external view returns (address[] memory);

    /**
     * @notice A function to update when the validator was lastly active
     * @param validator The validator to set the last participation for
     */
    function updateValidatorParticipation(address validator) external;
}
