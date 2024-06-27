// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {IPenalizeableStaking, PenalizedStakeDistribution, WithdrawalInfo} from "./IPenalizeableStaking.sol";
import {ValidatorManagerConnector} from "./../ValidatorManagerConnector.sol";

contract PenalizeableStaking is IPenalizeableStaking, ValidatorManagerConnector, Staking {
    /**
     * @notice The withdrawal info that is required for a banned validator to withdraw the funds left
     * @dev The withdrawal amount is calculated as the difference between
     * the validator's total stake and any penalties applied due to a ban
     */
    mapping(address => uint256) public leftToWithdrawPerStaker;

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

    function withdrawBannedFunds() external {
        uint256 leftToWithdraw = leftToWithdrawPerStaker[msg.sender];
        delete leftToWithdrawPerStaker[msg.sender];
        _withdraw(msg.sender, leftToWithdraw);
        _afterWithdrawBannedFundsHook(msg.sender, leftToWithdraw);
    }

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

    function _afterPenalizeStakerHook(address staker, uint256 unstakeAmount, uint256 leftForStaker) internal virtual {}

    function _afterWithdrawBannedFundsHook(address staker, uint256 withdrawnAmount) internal virtual {}

    function _handleWithdrawal(address account, uint256 amount) private {
        if (account == address(0)) {
            _withdraw(account, amount);
        } else {
            _registerWithdrawal(account, amount);
        }
    }
}
