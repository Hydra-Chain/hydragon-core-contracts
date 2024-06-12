// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct StakerInit {
    address addr;
    uint256 stake;
}

struct PenaltyReward {
    address account;
    uint256 amount;
}

interface IHydraStaking {
    event Staked(address indexed validator, uint256 amount);
    event Unstaked(address indexed validator, uint256 amount);

    error InvalidMinStake();
    error LowStake();

    /**
     * @notice Returns the total balance of a given validator
     * @param account The address of the validator
     * @return Validator's balance
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Gets the total amount delegated to a validator.
     * @param validator Address of validator
     * @return Amount delegated (in HYDRA wei)
     */
    function totalDelegationOf(address validator) external view returns (uint256);

    /**
     * @notice Returns the total supply
     * @return Total supply
     */
    function totalSupply() external view returns (uint256);

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

    /**
     * @dev Should be called by the Governance.
     * @notice Changes minimum stake required for validators.
     * @param newMinStake New minimum stake
     */
    function changeMinStake(uint256 newMinStake) external;

    function penalizeValidator(
        address validator,
        uint256 unstakeAmount,
        PenaltyReward[] calldata penaltyRewards
    ) external;
}
