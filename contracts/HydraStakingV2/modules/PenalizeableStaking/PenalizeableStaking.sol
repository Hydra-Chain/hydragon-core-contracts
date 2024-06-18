// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {IPenalizeableStaking, PenaltyReward, WithdrawalInfo} from "./IPenalizeableStaking.sol";
import {ValidatorManagerConnector} from "./../ValidatorManagerConnector.sol";

contract PenalizeableStaking is IPenalizeableStaking, Staking, ValidatorManagerConnector {
    /**
     * @notice The withdrawal info that is required for a banned validator to withdraw the funds left
     * @dev The withdrawal amount is calculated as the difference between
     * the validator's total stake and any penalties applied due to a ban
     */
    mapping(address => WithdrawalInfo) public withdrawalBalances;

    function penalizeValidator(
        address validator,
        uint256 unstakeAmount,
        PenaltyReward[] calldata penaltyRewards
    ) external {
        // TODO: Check if the amount after unstake is gonna be smaller than the minimum stake and if yes - unstake the totalStake
        (uint256 stakeLeft, uint256 withdrawAmount) = _unstake(validator, unstakeAmount);
        if (stakeLeft == 0) {
            validatorManagerContract.deactivateValidator(msg.sender);
        }

        for (uint256 i = 0; i < penaltyRewards.length; i++) {
            PenaltyReward memory reward = penaltyRewards[0];
            if (withdrawAmount < reward.amount) {
                _handleWithdrawal(reward.account, withdrawAmount);
                withdrawAmount = 0;
                break;
            }

            _handleWithdrawal(reward.account, reward.amount);
            withdrawAmount -= reward.amount;
        }

        if (withdrawAmount > 0) {
            withdrawalBalances[validator].liquidTokens += unstakeAmount;
            withdrawalBalances[validator].withdrawableAmount += withdrawAmount;
        }
    }

    function withdrawBannedFunds() public {
        WithdrawalInfo memory withdrawalBalance = withdrawalBalances[msg.sender];

        delete withdrawalBalances[msg.sender];

        LiquidStaking._collectTokens(msg.sender, withdrawalBalance.liquidTokens);

        _withdraw(msg.sender, withdrawalBalance.withdrawableAmount);
    }

    function _handleWithdrawal(address account, uint256 amount) private {
        if (account == address(0)) {
            _withdraw(account, amount);
        } else {
            _registerWithdrawal(account, amount);
        }
    }
}
