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

    /// @notice The block numbers threshold that needs to be passed to ban a validator
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

    // _______________ External functions _______________

    /**
     * @inheritdoc IInspector
     */
    function banValidatorByOwner(address validator) external onlyOwner {
        _ban(validator);
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
    function banValidator(address validator) public {
        uint256 lastCommittedEndBlock = epochs[currentEpochId - 1].endBlock;
        // number of blocks that the validator has been active for, must be more than threshold
        uint256 activeFor = lastCommittedEndBlock - validatorParticipation[validator].activeFrom;
        // if the validator has not been active for more than the threshold or has been active in the required timeframe, then exit
        if (
            validatorParticipation[validator].activeFrom == 0 ||
            activeFor < banTreshold ||
            lastCommittedEndBlock - validatorParticipation[validator].lastlyActive < banTreshold
        ) {
            revert ThresholdNotReached();
        }

        _ban(validator);
    }

    // _______________ Private functions _______________

    function _ban(address validator) private {
        uint256 totalAmount = balanceOf(validator);
        uint256 validatorStake = totalAmount - rewardPool.totalDelegationOf(validator);
        if (validatorStake != 0) {
            _burn(validator, validatorStake);
            StateSyncer._syncStake(validator, 0);
            uint256 amountLeft = rewardPool.onUnstake(validator, validatorStake, 0);

            uint256 penalty = validatorPenalty;
            if (amountLeft < penalty) penalty = amountLeft;

            withdrawalBalances[validator].liquidTokens = validatorStake;
            withdrawalBalances[validator].withdrawableAmount = amountLeft - penalty;
        }

        validators[validator].status = ValidatorStatus.Banned;

        emit ValidatorBanned(validator);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
