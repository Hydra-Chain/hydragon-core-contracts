// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IVesting} from "../../../common/Vesting/IVesting.sol";
import {IDelegation} from "../../IDelegation.sol";
import {RPS, DelegationPoolDelegatorParams} from "../DelegationPoolLib/IDelegationPoolLib.sol";

interface IVestedDelegation is IVesting, IDelegation {
    event PositionOpened(
        address indexed manager,
        address indexed staker,
        uint256 indexed weeksDuration,
        uint256 amount
    );
    event PositionCut(address indexed manager, address indexed staker, uint256 amount);
    event PositionSwapped(
        address indexed manager,
        address indexed oldStaker,
        address indexed newStaker,
        uint256 amount
    );
    event PositionRewardClaimed(address indexed manager, address indexed staker, uint256 amount);

    error NotVestingManager();

    /**
     * @notice Calculates position's claimable rewards
     * @param staker Address of validator
     * @param delegator Address of delegator
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to re-delegate the claimed rewards
     * @return reward Delegator's unclaimed rewards per staker (in HYDRA wei)
     */
    function calculatePositionClaimableReward(
        address staker,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external view returns (uint256 reward);

    /**
     * @notice Calculates the delegators's total rewards distributed (pending and claimable).
     * Pending - such that are not matured so not claimable yet.
     * Claimable - such that are matured and claimable.
     * @param staker Address of validator
     * @param delegator Address of delegator
     * @param epochNumber Epoch where the last reward for the vesting period is distributed
     * @param balanceChangeIndex Whether to re-delegate the claimed rewards for the full position period
     * @return reward Pending rewards expected by the delegator from a staker (in HYDRA wei)
     */
    function calculatePositionTotalReward(
        address staker,
        address delegator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external view returns (uint256 reward);

    /**
     * @notice Gets the RPS values for a staker in a given epoch range.
     * @param staker Validator that is deleagted to
     * @param startEpoch Start epoch for values
     * @param endEpoch End epoch for values
     */
    function getRPSValues(address staker, uint256 startEpoch, uint256 endEpoch) external view returns (RPS[] memory);

    /**
     * @notice Gets the delegation pool params history for a staker and delegator.
     * @param staker Validator that is delegated to
     * @param delegator Delegator that delegated
     */
    function getDelegationPoolParamsHistory(
        address staker,
        address delegator
    ) external view returns (DelegationPoolDelegatorParams[] memory);

    /**
     * @notice Calculates the penalty for the position.
     * @param staker Validator to calculate penalty for
     * @param delegator Delegator to calculate penalty for
     * @param amount Amount to calculate penalty for
     */
    function calculatePositionPenalty(
        address staker,
        address delegator,
        uint256 amount
    ) external view returns (uint256 penalty);

    /**
     * @notice Returns true if the position is active.
     * @param staker Validator for the position
     * @param delegator Delegator for the position
     */
    function isActiveDelegatePosition(address staker, address delegator) external view returns (bool);

    /**
     * @notice Returns true if the position is maturing.
     * @param staker Validator for the position
     * @param delegator Delegator for the position
     */
    function isMaturingDelegatePosition(address staker, address delegator) external view returns (bool);

    /**
     * @notice Returns true if the position is in the vesting cycle. (Active or maturing)
     * @param staker Validator for the position
     * @param delegator Delegator for the position
     */
    function isInVestingCycleDelegatePosition(address staker, address delegator) external view returns (bool);

    /**
     * @notice Delegates sent amount to staker. Set vesting position data.
     * Delete old pool params data, if exists.
     * Can be used by vesting positions' managers only.
     * @param staker Validator to delegate to
     * @param durationWeeks Duration of the vesting in weeks
     */
    function delegateWithVesting(address staker, uint256 durationWeeks) external payable;

    /**
     * @notice Undelegates amount from staker for vesting position. Apply penalty in case vesting is not finished.
     * Can be called by vesting positions' managers only.
     * @param staker Validator to undelegate from
     * @param amount Amount to be undelegated
     */
    function undelegateWithVesting(address staker, uint256 amount) external;

    /**
     * @notice Move a vested position to another staker.
     * Can be called by vesting positions' managers only.
     * @param oldStaker Validator to swap from
     * @param newStaker Validator to swap to
     */
    function swapVestedPositionStaker(address oldStaker, address newStaker) external;

    /**
     * @notice Claims reward for the vest manager (delegator) and distribute it to the desired address.
     * Also commission is distributed to the validator.
     * @dev It can be called only by the vest manager
     * @param staker Validator to claim from
     * @param to Address to transfer the reward to
     * @param epochNumber Epoch where the last claimable reward is distributed
     * We need it because not all rewards are matured at the moment of claiming
     * @param balanceChangeIndex Whether to re-delegate the claimed rewards
     */
    function claimPositionReward(address staker, address to, uint256 epochNumber, uint256 balanceChangeIndex) external;

    // _______________ Public functions _______________

    /**
     * @notice Checks if balance change was already made in the current epoch
     * @param staker Validator to delegate to
     * @param delegator Delegator that has delegated
     * @param currentEpochNum Current epoch number
     */
    function isBalanceChangeMade(
        address staker,
        address delegator,
        uint256 currentEpochNum
    ) external view returns (bool);

    /**
     * @notice Check if the a position that the user wants to delegate to is available
     * @dev Available positions are ones that are not active and don't have any rewards (including maturing rewards)
     * @param staker The address of the new validator
     * @param delegator The address of the delegator
     */
    function isPositionAvailable(address staker, address delegator) external view returns (bool);

    /**
     * @notice Check if the a position that the user wants to swap to is available
     * @dev Available positions are ones that are not active and don't have any left balance or rewards (including maturing rewards)
     * @param staker Validator to delegate to
     * @param delegator Delegator that has delegated
     */
    function isPositionAvailableForSwap(address staker, address delegator) external view returns (bool);
}
