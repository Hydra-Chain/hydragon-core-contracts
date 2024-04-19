// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./IStaking.sol";
import "./StateSyncer.sol";
import "./LiquidStaking.sol";
import "./BalanceState.sol";
import "./../Withdrawal/Withdrawal.sol";
import "./../AccessControl/AccessControl.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

abstract contract Staking is
    IStaking,
    ValidatorSetBase,
    BalanceState,
    Withdrawal,
    LiquidStaking,
    StateSyncer,
    AccessControl
{
    /// @notice A constant for the maximum comission a validator can receive from the delegator's rewards
    uint256 public constant MAX_COMMISSION = 100;
    /// @notice A state variable to keep the minimum amount of stake
    uint256 public minStake;

    // _______________ Modifiers _______________

    modifier onlyValidator() {
        if (!validators[msg.sender].active) revert Unauthorized("VALIDATOR");
        _;
    }

    // _______________ Initializer _______________

    function __Staking_init(uint256 newMinStake, address newLiquidToken) internal onlyInitializing {
        __LiquidStaking_init(newLiquidToken);
        __Staking_init_unchained(newMinStake);
    }

    function __Staking_init_unchained(uint256 newMinStake) internal onlyInitializing {
        if (newMinStake < 1 ether) revert InvalidMinStake(newMinStake);
        minStake = newMinStake;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IStaking
     */
    function setCommission(uint256 newCommission) external onlyValidator {
        _setCommission(msg.sender, newCommission);
    }

    /**
     * @inheritdoc IStaking
     */
    function register(uint256[2] calldata signature, uint256[4] calldata pubkey, uint256 commission) external {
        if (validators[msg.sender].registered) revert AlreadyRegistered(msg.sender);
        if (!validators[msg.sender].whitelisted) revert Unauthorized("WHITELIST");
        _register(msg.sender, signature, pubkey, commission);
        _removeFromWhitelist(msg.sender);

        emit NewValidator(msg.sender, pubkey);
    }

    /**
     * @inheritdoc IStaking
     */
    function stake() external payable onlyValidator {
        uint256 currentBalance = balanceOf(msg.sender);
        _stake(msg.sender, msg.value);
        rewardPool.onStake(msg.sender, msg.value, currentBalance);
    }

    /**
     * @inheritdoc IStaking
     */
    function stakeWithVesting(uint256 durationWeeks) external payable onlyValidator {
        _stake(msg.sender, msg.value);
        rewardPool.onNewStakePosition(msg.sender, durationWeeks);
    }

    /**
     * @inheritdoc IStaking
     */
    function unstake(uint256 amount) external {
        uint256 balanceAfterUnstake = _unstake(amount);
        StateSyncer._syncStake(msg.sender, balanceAfterUnstake);
        LiquidStaking._collectTokens(msg.sender, amount);
        uint256 amountToWithdraw = rewardPool.onUnstake(msg.sender, amount, balanceAfterUnstake);
        _registerWithdrawal(msg.sender, amountToWithdraw);

        emit Unstaked(msg.sender, amount);
    }

    // _______________ Internal functions _______________

    function _register(
        address validator,
        uint256[2] calldata signature,
        uint256[4] calldata pubkey,
        uint256 commission
    ) internal {
        _verifyValidatorRegistration(validator, signature, pubkey);
        validators[validator].blsKey = pubkey;
        validators[validator].active = true;
        validators[validator].registered = true;
        _setCommission(validator, commission);

        validatorsAddresses.push(validator);
        rewardPool.onNewValidator(validator);
    }

    function _stake(address account, uint256 amount) internal {
        uint256 currentBalance = balanceOf(account);
        if (amount + currentBalance < minStake) revert StakeRequirement({src: "stake", msg: "STAKE_TOO_LOW"});

        _mint(account, amount);
        StateSyncer._syncStake(account, currentBalance + amount);
        LiquidStaking._distributeTokens(account, amount);

        emit Staked(account, amount);
    }

    // _______________ Private functions _______________

    function _unstake(uint256 amount) private returns (uint256) {
        uint256 currentBalance = balanceOf(msg.sender);
        if (amount > currentBalance) revert StakeRequirement({src: "unstake", msg: "INSUFFICIENT_BALANCE"});

        uint256 balanceAfterUnstake = currentBalance - amount;
        if (balanceAfterUnstake < minStake && balanceAfterUnstake != 0)
            revert StakeRequirement({src: "unstake", msg: "STAKE_TOO_LOW"});

        _burn(msg.sender, amount);
        _removeIfValidatorUnstaked(msg.sender, balanceAfterUnstake);

        return balanceAfterUnstake;
    }

    function _removeIfValidatorUnstaked(address validator, uint256 newStake) private {
        if (newStake == 0) {
            validators[validator].active = false;
            emit ValidatorDeactivated(validator);
        }
    }

    function _ensureStakeIsInRange(uint256 amount, uint256 currentBalance) private view {
        if (amount + currentBalance < minStake) revert StakeRequirement({src: "stake", msg: "STAKE_TOO_LOW"});
    }

    function _setCommission(address validator, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission(newCommission);

        validators[validator].commission = newCommission;

        emit CommissionUpdated(validator, newCommission);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
