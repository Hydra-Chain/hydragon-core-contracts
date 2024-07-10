// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {IPenalizeableStaking, PenalizedStakeDistribution, WithdrawalInfo} from "./IPenalizeableStaking.sol";
import {ValidatorManagerConnector} from "./../../../HydraChain/modules/ValidatorManager/ValidatorManagerConnector.sol";
contract PenalizeableStaking is IPenalizeableStaking, ValidatorManagerConnector, Staking {
    /**
     * @notice The withdrawal info that is required for a banned validator to withdraw the funds left
     * @dev The withdrawal amount is calculated as the difference between
     * the validator's total stake and any penalties applied due to a ban
     */
    mapping(address => uint256) public leftToWithdrawPerStaker;

    // _______________ Initializer _______________

    function __PenalizeableStaking_init() internal onlyInitializing {}

    // _______________ External functions _______________

    /**
     * @inheritdoc IPenalizeableStaking
     */
    function penalizeStaker(
        address staker,
        uint256 unstakeAmount,
        PenalizedStakeDistribution[] calldata stakeDistributions
    ) external onlyValidatorManager {
        // TODO: Check if the amount after unstake is gonna be smaller than the minimum stake and if yes - unstake the totalStake
        // We use the base _unstake, because we don't want all extensions to be executed on penalty
        (uint256 stakeLeft, uint256 withdrawAmount) = Staking._unstake(staker, unstakeAmount);
        if (stakeLeft == 0) {
            validatorManagerContract.deactivateValidator(msg.sender);
        }

        uint256 leftForStaker = _distributePenalizedStake(withdrawAmount, stakeDistributions);
        if (leftForStaker > 0) {
            leftToWithdrawPerStaker[staker] += leftForStaker;
        }

        _afterPenalizeStakerHook(staker, unstakeAmount, leftForStaker);
    }

    /**
     * @inheritdoc IPenalizeableStaking
     */
    function withdrawBannedFunds() external {
        uint256 leftToWithdraw = leftToWithdrawPerStaker[msg.sender];
        delete leftToWithdrawPerStaker[msg.sender];
        _withdraw(msg.sender, leftToWithdraw);
        _afterWithdrawBannedFundsHook(msg.sender, leftToWithdraw);
    }

    // _______________ Internal functions _______________

    /**
     * @notice Distributes penelized stake to the stakers
     * @param withdrawAmount The amount to withdraw
     * @param stakeDistributions The distribution of the penalty
     */
    function _distributePenalizedStake(
        uint256 withdrawAmount,
        PenalizedStakeDistribution[] calldata stakeDistributions
    ) internal returns (uint256 leftForStaker) {
        for (uint256 i = 0; i < stakeDistributions.length; i++) {
            PenalizedStakeDistribution memory reward = stakeDistributions[0];
            if (withdrawAmount < reward.amount) {
                _handleWithdrawal(reward.account, withdrawAmount);
                return 0;
            }

            _handleWithdrawal(reward.account, reward.amount);
            withdrawAmount -= reward.amount;
        }

        return withdrawAmount;
    }


    /**
     * @notice Performs the necessary actions after a staker is penalized.
     * @dev Virtual function to be overridden by the child contract
     * @param staker The staker to penalize
     * @param unstakeAmount The amount to unstake
     * @param leftForStaker The amount left for the staker
     */
    function _afterPenalizeStakerHook(address staker, uint256 unstakeAmount, uint256 leftForStaker) internal virtual {}

    /**
     * @notice Performs the necessary actions after a staker withdraws banned funds.
     * @dev Virtual function to be overridden by the child contract
     * @param staker The staker to withdraw banned funds
     * @param withdrawnAmount The amount to withdraw
     */
    function _afterWithdrawBannedFundsHook(address staker, uint256 withdrawnAmount) internal virtual {}


    /**
     * @notice Handles the withdrawal of the given amount for the given account
     * @param account The address of the account
     * @param amount The amount to withdraw
     */
    function _handleWithdrawal(address account, uint256 amount) private {
        if (account == address(0)) {
            _withdraw(account, amount);
        } else {
            _registerWithdrawal(account, amount);
        }
    }
}
