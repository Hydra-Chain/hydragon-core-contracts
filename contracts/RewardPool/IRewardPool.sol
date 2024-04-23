// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./../ValidatorSet/IValidatorSet.sol";
import "./../common/CommonStructs.sol";

struct DelegationPool {
    uint256 supply;
    uint256 virtualSupply;
    uint256 magnifiedRewardPerShare;
    address validator;
    mapping(address => int256) magnifiedRewardCorrections;
    mapping(address => uint256) claimedRewards;
    mapping(address => uint256) balances;
}

struct Uptime {
    address validator;
    uint256 signedBlocks;
}

interface IRewardPool {
    event ValidatorRewardClaimed(address indexed validator, uint256 amount);
    event ValidatorRewardDistributed(address indexed validator, uint256 amount);
    event DelegatorRewardClaimed(address indexed validator, address indexed delegator, uint256 amount);
    event DelegatorRewardDistributed(address indexed validator, uint256 amount);
    event PositionRewardClaimed(address indexed manager, address indexed validator, uint256 amount);

    /**
     * @notice Distributes rewards for the given epoch
     * @dev Transfers funds from sender to this contract
     * @param epochId The epoch number
     * @param uptime uptime data for every validator
     * @param epochSize Number of blocks per epoch
     */
    function distributeRewardsFor(uint256 epochId, Uptime[] calldata uptime, uint256 epochSize) external payable;

    /**
     * @notice Update the reward params for the vested position
     * @param staker Address of the staker
     * @param amount Amount to stake
     * @param oldBalance Balance before stake
     */
    function onStake(address staker, uint256 amount, uint256 oldBalance) external;

    /**
     * @notice Unstakes and updates the reward params for the vested position
     * @dev If vested position is active, then it will calculate a penalty in the returned amount
     * @param staker Address of the staker
     * @param amountUnstaked Unstaked amount
     * @param amountLeft The staked amount left
     * @return amountToWithdraw The calcualted amount to withdraw
     */
    function onUnstake(
        address staker,
        uint256 amountUnstaked,
        uint256 amountLeft
    ) external returns (uint256 amountToWithdraw);

    /**
     * @notice Delegates to a validator delegation pool
     * @dev Claims rewards and returns it in order to make the withdrawal in the delegation contract
     * @param validator The address of the validator
     * @param delegator The address of the delegator
     * @param amount Amount to delegate
     */
    function onDelegate(address validator, address delegator, uint256 amount) external;

    /**
     * @notice Undelegates from the delegation pools and claims rewards
     * @dev Returns the reward in order to make the withdrawal in the delegation contract
     * @param validator The address of the validator
     * @param delegator The address of the delegator
     * @param amount Amount to delegate
     */
    function onUndelegate(address validator, address delegator, uint256 amount) external;

    /**
     * @notice Creates a pool
     * @dev Sets the validator of the pool
     * @param validator The address of the validator
     */
    function onNewValidator(address validator) external;

    /**
     * @notice Sets the reward params for the new vested position
     * @param staker Address of the staker
     * @param durationWeeks Vesting duration in weeks
     */
    function onNewStakePosition(address staker, uint256 durationWeeks) external;

    /**
     * @notice Sets the reward params for the new vested delegation position
     * @param validator The address of the validator
     * @param delegator The address of the delegator
     * @param durationWeeks Vesting duration in weeks
     * @param currentEpochId The currenct epoch number
     * @param amount Delegate amount to open position with
     */
    function onNewDelegatePosition(
        address validator,
        address delegator,
        uint256 durationWeeks,
        uint256 currentEpochId,
        uint256 amount
    ) external;

    /**
     * @notice Top up to a delegate positions
     * @param validator The address of the validator
     * @param delegator The address of the delegator
     * @param currentEpochId The currenct epoch number
     * @param amount Delegate amount to top-up with
     */
    function onTopUpDelegatePosition(
        address validator,
        address delegator,
        uint256 currentEpochId,
        uint256 amount
    ) external;

    /**
     * @notice Cuts a vesting position from the delegation pool
     * @dev Applies penalty (slashing) if the vesting period is active and returns the updated amount
     * @param validator The address of the validator
     * @param delegator The address of the delegator
     * @param amount Amount to delegate
     * @param currentEpochId The currenct epoch number
     * @return penalty The penalty which will be taken from the delgator's amount and burned, if the position is active
     * @return fullReward The full reward that is going to be burned, if the position is active
     */
    function onCutPosition(
        address validator,
        address delegator,
        uint256 amount,
        uint256 currentEpochId
    ) external returns (uint256 penalty, uint256 fullReward);

    /**
     * @notice Claims delegator rewards for sender.
     * @param validator Validator to claim from
     */
    function claimDelegatorReward(address validator) external;

    /**
     * @notice Returns the generated rewards for a validator
     * @dev Applies penalty (slashing) if the vesting period is active and returns the updated amount
     * @param validator The address of the validator
     * @return Delgator's unclaimed rewards
     */
    function getValidatorReward(address validator) external view returns (uint256);

    /**
     * @notice Gets delegator's unclaimed rewards without custom rewards
     * @param validator Address of validator
     * @param delegator Address of delegator
     * @return Delegator's unclaimed rewards with validator (in MATIC wei)
     */
    function getRawDelegatorReward(address validator, address delegator) external view returns (uint256);

    /**
     * @notice Gets delegators's unclaimed rewards including custom rewards
     * @param validator Address of validator
     * @param delegator Address of delegator
     * @return Delegator's unclaimed rewards with validator (in MATIC wei)
     */
    function getDelegatorReward(address validator, address delegator) external view returns (uint256);

    /**
     * @notice Gets delegators's unclaimed rewards including custom rewards for a position
     * @param validator Address of validator
     * @param delegator Address of delegator
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param topUpIndex Whether to redelegate the claimed rewards
     * @return Delegator's unclaimed rewards with validator (in MATIC wei)
     */
    function getDelegatorPositionReward(
        address validator,
        address delegator,
        uint256 epochNumber,
        uint256 topUpIndex
    ) external view returns (uint256);

    /**
     * @notice Gets delegators's history of the delegated position
     * @param validator Address of validator
     * @param delegator Address of delegator
     * @return Delegator's history of the delegated position
     */
    function getDelegationPoolParamsHistory(
        address validator,
        address delegator
    ) external view returns (DelegationPoolParams[] memory);

    /**
     * @notice Returns the penalty and reward that will be burned, if vested stake position is active
     * @param staker The address of the staker
     * @param amount The amount that is going to be unstaked
     * @return penalty for the staker
     * @return reward of the staker
     */
    function calculateStakePositionPenalty(
        address staker,
        uint256 amount
    ) external view returns (uint256 penalty, uint256 reward);

    /**
     * @notice Returns the penalty that will taken from the delegator, if the position is still active
     * @param validator The address of the validator
     * @param delegator The address of the delegator
     * @param amount The amount that is going to be undelegated
     * @return penalty for the delegator
     */
    function calculatePositionPenalty(
        address validator,
        address delegator,
        uint256 amount
    ) external view returns (uint256 penalty);

    /**
     * @notice Returns the total reward that is generated for a position
     * @param validator The address of the validator
     * @param delegator The address of the delegator
     * @return reward for the delegator
     */
    function calculateTotalPositionReward(address validator, address delegator) external view returns (uint256 reward);

    /**
     * @notice Claims reward for the vest manager (delegator).
     * @param validator Validator to claim from
     * @param to Address to transfer the reward to
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param topUpIndex Whether to redelegate the claimed rewards
     */
    function claimPositionReward(address validator, address to, uint256 epochNumber, uint256 topUpIndex) external;

    /**
     * @notice Gets amount delegated by delegator to validator.
     * @param validator Address of validator
     * @param delegator Address of delegator
     * @return Amount delegated (in MATIC wei)
     */
    function delegationOf(address validator, address delegator) external view returns (uint256);

    /**
     * @notice Gets the total amount delegated to a validator.
     * @param validator Address of validator
     * @return Amount delegated (in MATIC wei)
     */
    function totalDelegationOf(address validator) external view returns (uint256);
}
