// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./IStaking.sol";
import "./StateSyncer.sol";
import "./LiquidStaking.sol";
import "./BalanceState.sol";
import "./../Withdrawal/Withdrawal.sol";
import "./../../IValidatorSet.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

abstract contract Staking is IStaking, ValidatorSetBase, BalanceState, Withdrawal, LiquidStaking, StateSyncer {
    /// @notice A constant for the minimum stake limit
    uint256 public constant MIN_STAKE_LIMIT = 1 ether;
    /// @notice A constant for the maximum comission a validator can receive from the delegator's rewards
    uint256 public constant MAX_COMMISSION = 100;
    /// @notice A constant for the maximum amount of validators
    uint256 public constant MAX_VALIDATORS = 150;
    /// @notice A state variable to keep the minimum amount of stake
    uint256 public minStake;

    // _______________ Initializer _______________

    function __Staking_init(uint256 newMinStake, address newLiquidToken) internal onlyInitializing {
        __LiquidStaking_init(newLiquidToken);
        __Staking_init_unchained(newMinStake);
    }

    function __Staking_init_unchained(uint256 newMinStake) internal onlyInitializing {
        _changeMinStake(newMinStake);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IStaking
     */
    function setCommission(uint256 newCommission) external onlyValidator(msg.sender) {
        _setCommission(msg.sender, newCommission);
    }

    /**
     * @inheritdoc IStaking
     */
    function register(uint256[2] calldata signature, uint256[4] calldata pubkey, uint256 commission) external {
        if (validators[msg.sender].status != ValidatorStatus.Whitelisted) revert Unauthorized("WHITELIST");
        _register(msg.sender, signature, pubkey, commission);

        emit NewValidator(msg.sender, pubkey);
    }

    /**
     * @inheritdoc IStaking
     */
    function stake() external payable onlyValidator(msg.sender) {
        uint256 currentBalance = balanceOf(msg.sender);
        _stake(msg.sender, msg.value);
        rewardPool.onStake(msg.sender, msg.value, currentBalance);
    }

    /**
     * @inheritdoc IStaking
     */
    function stakeWithVesting(uint256 durationWeeks) external payable onlyValidator(msg.sender) {
        _stake(msg.sender, msg.value);
        rewardPool.onNewStakePosition(msg.sender, durationWeeks);
    }

    /**
     * @inheritdoc IStaking
     */
    function unstake(uint256 amount) external {
        (uint256 validatorStakeLeft, uint256 totalStakeLeft) = _unstake(msg.sender, amount);
        uint256 syncAmount = totalStakeLeft;
        if (validatorStakeLeft == 0) {
            validators[msg.sender].status = ValidatorStatus.Registered;
            syncAmount = validatorStakeLeft;
        }

        StateSyncer._syncStake(msg.sender, syncAmount);
        LiquidStaking._collectTokens(msg.sender, amount);
        uint256 amountToWithdraw = rewardPool.onUnstake(msg.sender, amount, validatorStakeLeft);
        _registerWithdrawal(msg.sender, amountToWithdraw);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @inheritdoc IStaking
     */
    function changeMinStake(uint256 newMinStake) external onlyOwner {
        _changeMinStake(newMinStake);
    }

    // _______________ Internal functions _______________

    function _register(
        address validator,
        uint256[2] calldata signature,
        uint256[4] calldata pubkey,
        uint256 commission
    ) internal {
        if (currentValidators == MAX_VALIDATORS) revert MaxValidatorsReached();
        _verifyValidatorRegistration(validator, signature, pubkey);
        validators[validator].blsKey = pubkey;
        validators[validator].status = ValidatorStatus.Registered;
        _setCommission(validator, commission);
        unchecked {
            currentValidators++;
        }
        rewardPool.onNewValidator(validator);
    }

    function _stake(address account, uint256 amount) internal {
        uint256 currentBalance = balanceOf(account);
        if (amount + currentBalance < minStake) revert StakeRequirement({src: "stake", msg: "STAKE_TOO_LOW"});

        _increaseAccountBalance(account, amount);
        StateSyncer._syncStake(account, currentBalance + amount);
        LiquidStaking._distributeTokens(account, amount);

        if (currentBalance == 0) {
            validators[account].status = ValidatorStatus.Active;
            _updateParticipation(account);
        }

        emit Staked(account, amount);
    }

    function _unstake(
        address validator,
        uint256 amount
    ) internal returns (uint256 validatorStakeLeft, uint256 totalStakeLeft) {
        uint256 totalStake = balanceOf(validator);
        uint256 delegation = rewardPool.totalDelegationOf(validator);
        uint256 validatorStake = totalStake - delegation;
        if (amount > validatorStake) revert StakeRequirement({src: "unstake", msg: "INSUFFICIENT_BALANCE"});

        totalStakeLeft = totalStake - amount;
        validatorStakeLeft = validatorStake - amount;
        if (validatorStakeLeft < minStake && validatorStakeLeft != 0)
            revert StakeRequirement({src: "unstake", msg: "STAKE_TOO_LOW"});

        _decreaseAccountBalance(validator, amount);
    }

    // _______________ Private functions _______________

    function _ensureStakeIsInRange(uint256 amount, uint256 currentBalance) private view {
        if (amount + currentBalance < minStake) revert StakeRequirement({src: "stake", msg: "STAKE_TOO_LOW"});
    }

    function _setCommission(address validator, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission(newCommission);

        validators[validator].commission = newCommission;

        emit CommissionUpdated(validator, newCommission);
    }

    function _changeMinStake(uint256 newMinStake) private {
        if (newMinStake < MIN_STAKE_LIMIT) revert InvalidMinStake();
        minStake = newMinStake;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
