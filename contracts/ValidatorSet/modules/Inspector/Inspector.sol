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

    /// @notice Validator inactiveness (in blocks) threshold that needs to be passed to ban a validator
    uint256 public banTreshold;

    /**
     * @notice The withdrawal info that is required for a banned validator to withdraw the funds left
     * @dev The withdrawal amount is calculated as the difference between
     * the validator's total stake and any penalties applied due to a ban
     */
    mapping(address => WithdrawalInfo) public withdrawalBalances;

    // _______________ Modifiers _______________

    // Only address that is banned
    modifier onlyBanned() {
        if (validators[msg.sender].status != ValidatorStatus.Banned) revert Unauthorized("UNBANNED_VALIDATOR");
        _;
    }

    // _______________ Initializer _______________

    function __Inspector_init() internal onlyInitializing {
        __Inspector_init_unchained();
    }

    function __Inspector_init_unchained() internal onlyInitializing {
        validatorPenalty = 700 ether;
        reporterReward = 300 ether;
        banTreshold = 123428; // the approximate number of blocks for 72 hours
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
    function setBanThreshold(uint256 newThreshold) public onlyOwner {
        banTreshold = newThreshold;
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

    /**
     * @inheritdoc IInspector
     */
    function banValidator(address validator) public onlyValidator(validator) {
        uint256 lastCommittedEndBlock = epochs[currentEpochId - 1].endBlock;
        // check if the threshold is reached when the method is not executed by the owner (governance)
        if (msg.sender != owner() && lastCommittedEndBlock - validatorParticipation[validator] < banTreshold) {
            revert ThresholdNotReached();
        }

        _ban(validator);
    }

    // _______________ Private functions _______________

    /**
     * @dev A method that executes the actions for the actual ban
     * @param validator The address of the validator
     */
    function _ban(address validator) private {
        uint256 totalAmount = balanceOf(validator);
        uint256 validatorStake = totalAmount - rewardPool.totalDelegationOf(validator);
        uint256 reward = 0;
        if (validatorStake != 0) {
            _burnAccountStake(validator, validatorStake);

            (uint256 amountLeftToWithdraw, uint256 rewardToWithdraw) = _calculateWithdrawals(validator, validatorStake);

            reward = rewardToWithdraw;
            withdrawalBalances[validator].liquidTokens = validatorStake;
            withdrawalBalances[validator].withdrawableAmount = amountLeftToWithdraw;
        }

        validators[validator].status = ValidatorStatus.Banned;
        if (reward != 0) _withdraw(msg.sender, reward);

        emit ValidatorBanned(validator);
    }

    function _burnAccountStake(address account, uint256 stake) private {
        _burn(account, stake);
        StateSyncer._syncStake(account, 0);
    }

    /**
     * @dev This function is used to calculation amount that will be left to withdraw
     * after applying validator penalty and the reward for the reporter
     * @param validator The address of the validator
     * @param validatorStake The stake of the validator
     * @return amountLeftToWithdraw The amount that will be left to withdraw by the autor
     * @return rewardToWithdraw The reward that will be send to the reporter
     */
    function _calculateWithdrawals(
        address validator,
        uint256 validatorStake
    ) private returns (uint256 amountLeftToWithdraw, uint256 rewardToWithdraw) {
        amountLeftToWithdraw = rewardPool.onUnstake(validator, validatorStake, 0);
        if (msg.sender != owner()) {
            uint256 _reporterReward = reporterReward;
            if (amountLeftToWithdraw < _reporterReward) {
                rewardToWithdraw = amountLeftToWithdraw;
                amountLeftToWithdraw = 0;
            } else {
                rewardToWithdraw = _reporterReward;
                amountLeftToWithdraw -= rewardToWithdraw;
            }
        }

        uint256 penalty = validatorPenalty;
        if (amountLeftToWithdraw < penalty) {
            amountLeftToWithdraw = 0;
        } else if (amountLeftToWithdraw != 0) {
            amountLeftToWithdraw -= penalty;
        }
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
