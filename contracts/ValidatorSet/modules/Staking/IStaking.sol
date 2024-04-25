// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IStaking {
    event NewValidator(address indexed validator, uint256[4] blsKey);
    event CommissionUpdated(address indexed validator, uint256 newCommission);
    event Staked(address indexed validator, uint256 amount);
    event Unstaked(address indexed validator, uint256 amount);

    /**
     * @notice Sets commission for validator.
     * @param newCommission New commission (100 = 100%)
     */
    function setCommission(uint256 newCommission) external;

    /**
     * @notice Validates BLS signature with the provided pubkey and registers validators into the set.
     * @param signature Signature to validate message against
     * @param pubkey BLS public key of validator
     * @param commission The commission rate for the delegators
     */
    function register(uint256[2] calldata signature, uint256[4] calldata pubkey, uint256 commission) external;

    /**
     * @notice Stakes sent amount.
     */
    function stake() external payable;

    /**
     * @notice Stakes sent amount with vesting period.
     * @param durationWeeks Duration of the vesting in weeks. Must be between 1 and 52.
     */
    function stakeWithVesting(uint256 durationWeeks) external payable;

    /**
     * @notice Unstakes amount for sender. Claims rewards beforehand.
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external;
}
