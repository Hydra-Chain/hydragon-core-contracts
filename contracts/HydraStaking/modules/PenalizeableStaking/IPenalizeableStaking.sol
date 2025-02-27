// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "../../IStaking.sol";

struct PenalizedStakeDistribution {
    address account;
    uint256 amount;
}

/**
 * @notice Data type for the banned validators' withdrawals
 * @param liquidTokens The amount of liquid tokens to be taken on withdrawal from the penalized staker
 * @param withdrawableAmount The amount that is available for withdrawal after staker's penalty
 */
struct WithdrawalInfo {
    uint256 liquidTokens;
    uint256 withdrawableAmount;
}

interface IPenalizeableStaking is IStaking {
    error NoFundsToWithdraw();
    error StakeLeftLow();

    /**
     * @notice Penalizes a staker by reducing their stake and distributing the penalty
     * @dev Only the validator manager can call this function
     * @param staker The address of the staker to penalize
     * @param stakeDistributions The distribution of the penalty
     */
    function penalizeStaker(address staker, PenalizedStakeDistribution[] calldata stakeDistributions) external;

    /**
     * @notice Register withdrawal of the penalized funds
     * @dev The funds will be available for withdrawal after the withdrawal waiting period
     */
    function initiatePenalizedFundsWithdrawal() external;
}
