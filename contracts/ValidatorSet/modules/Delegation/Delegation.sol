// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./IDelegation.sol";
import "./VestedDelegation.sol";
import "./../Staking/StateSyncer.sol";
import "./../Staking/LiquidStaking.sol";
import "./../Staking/BalanceState.sol";
import "./../Withdrawal/Withdrawal.sol";
import "./../../ValidatorSetBase.sol";
import "./../../../common/CommonStructs.sol";

abstract contract Delegation is
    IDelegation,
    ValidatorSetBase,
    BalanceState,
    VestedDelegation,
    Withdrawal,
    LiquidStaking,
    StateSyncer
{
    // _______________ Initializer _______________

    function __Delegation_init() internal onlyInitializing {
        __VestFactory_init();
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDelegation
     */
    function delegate(address validator) public payable {
        if (msg.value == 0) revert DelegateRequirement({src: "delegate", msg: "DELEGATING_AMOUNT_ZERO"});
        _delegate(validator, msg.sender, msg.value);
        rewardPool.onDelegate(validator, msg.sender, msg.value);
    }

    /**
     * @inheritdoc IDelegation
     */
    function undelegate(address validator, uint256 amount) external {
        rewardPool.onUndelegate(validator, msg.sender, amount);
        _undelegate(validator, msg.sender, amount);
        _registerWithdrawal(msg.sender, amount);
    }

    /**
     * @inheritdoc IDelegation
     */
    function delegateWithVesting(address validator, uint256 durationWeeks) external payable onlyManager {
        _delegate(validator, msg.sender, msg.value);
        rewardPool.onNewDelegatePosition(validator, msg.sender, durationWeeks, currentEpochId, msg.value);

        emit PositionOpened(msg.sender, validator, durationWeeks, msg.value);
    }

    /**
     * @inheritdoc IDelegation
     */
    function topUpDelegatePosition(address validator) external payable onlyManager {
        _delegate(validator, msg.sender, msg.value);

        rewardPool.onTopUpDelegatePosition(validator, msg.sender, currentEpochId, msg.value);

        emit PositionTopUp(msg.sender, validator, msg.value);
    }

    /**
     * @inheritdoc IDelegation
     */
    function undelegateWithVesting(address validator, uint256 amount) external onlyManager {
        (uint256 penalty, ) = rewardPool.onCutPosition(validator, msg.sender, amount, currentEpochId);
        _undelegate(validator, msg.sender, amount);
        uint256 amountAfterPenalty = amount - penalty;
        _burnAmount(penalty);
        _registerWithdrawal(msg.sender, amountAfterPenalty);

        emit PositionCut(msg.sender, validator, amountAfterPenalty);
    }

    // _______________ Private functions _______________

    function _delegate(address validator, address delegator, uint256 amount) private {
        if (validators[validator].status != ValidatorStatus.Registered) revert Unauthorized("INVALID_VALIDATOR");

        _mint(validator, amount); // increase validator power
        StateSyncer._syncStake(validator, balanceOf(validator));
        LiquidStaking._distributeTokens(delegator, amount);

        emit Delegated(validator, delegator, amount);
    }

    function _undelegate(address validator, address delegator, uint256 amount) private {
        _burn(validator, amount); // decrease validator power
        StateSyncer._syncStake(validator, balanceOf(validator));
        LiquidStaking._collectDelegatorTokens(delegator, amount);

        emit Undelegated(validator, delegator, amount);
    }

    function _burnAmount(uint256 amount) private {
        (bool success, ) = address(0).call{value: amount}("");
        require(success, "Failed to burn amount");
    }
}
