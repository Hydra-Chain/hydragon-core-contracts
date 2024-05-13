// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./IInspector.sol";
import "./../Staking/Staking.sol";
import "./../../../common/Errors.sol";

abstract contract Inspector is IInspector, Staking {
    /// @notice The penalty that will be taken and burned from the bad valiator's staked amount
    uint256 public validatorPenalty;

    /// @notice The reward for the person who reports a validator that have to be banned
    uint256 public reporterReward;

    /**
     * @notice The withdrawal info that is required for a banned validator to withdraw the funds left
     * @dev The withdrawal amount is calculated as the difference between
     * the validator's total stake and any penalties applied due to a ban
     */
    mapping(address => WithdrawalInfo) public withdrawalBalances;

    // _______________ Modifiers _______________

    // Only address that is banned
    modifier onlyBanned() {
        if (validators[msg.sender].status != ValidatorStatus.Banned) revert Unauthorized("BANNED_VALIDATOR");
        _;
    }

    // _______________ Initializer _______________

    function __Inspector_init() internal onlyInitializing {
        __Inspector_init_unchained();
    }

    function __Inspector_init_unchained() internal onlyInitializing {
        validatorPenalty = 700 ether;
        reporterReward = 300 ether;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IInspector
     */
    function banValidator(address validator) external onlyOwner {
        if (validators[validator].status != ValidatorStatus.Registered) revert Unauthorized("UNREGISTERED_VALIDATOR");

        uint256 stakedAmount = balanceOf(validator);
        if (stakedAmount != 0) {
            _burn(validator, stakedAmount);
            StateSyncer._syncStake(validator, 0);
            uint256 amountLeft = rewardPool.onUnstake(validator, stakedAmount, 0);

            uint256 penalty = validatorPenalty;
            if (amountLeft < penalty) penalty = amountLeft;

            withdrawalBalances[validator].liquidTokens = stakedAmount;
            withdrawalBalances[validator].withdrawableAmount = amountLeft - penalty;
        }

        validators[validator].status = ValidatorStatus.Banned;

        emit ValidatorBanned(validator);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IInspector
     */
    function setValidatorPenalty(uint256 newPenalty) public onlyOwner {
        validatorPenalty = newPenalty;
    }

    /**
     * @inheritdoc IInspector
     */
    function setReporterReward(uint256 newReward) public onlyOwner {
        reporterReward = newReward;
    }

    /**
     * @inheritdoc IInspector
     */
    function withdrawBannedFunds() public onlyBanned {
        WithdrawalInfo memory withdrawalBalance = withdrawalBalances[msg.sender];

        delete withdrawalBalances[msg.sender];

        LiquidStaking._collectTokens(msg.sender, withdrawalBalance.liquidTokens);

        _withdraw(msg.sender, withdrawalBalance.withdrawableAmount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
