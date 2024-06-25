// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IHydraStaking, StakerInit, PenaltyReward} from "./IHydraStaking.sol";
import {StateSyncer} from "./modules/StateSyncer.sol";
import {LiquidStaking} from "./modules/LiquidStaking.sol";
import {BalanceState} from "./modules/BalanceState.sol";
import {Withdrawal} from "./modules/Withdrawal.sol";
import {IRewardPool} from "./../RewardPool/IRewardPool.sol";
import {ValidatorManagerConnector} from "./modules/ValidatorManagerConnector.sol";
import {System} from "./../common/System/System.sol";

import {Unauthorized, StakeRequirement} from "./../common/Errors.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

contract HydraStaking is
    IHydraStaking,
    System,
    BalanceState,
    Withdrawal,
    LiquidStaking,
    StateSyncer,
    ValidatorManagerConnector
{
    /// @notice A constant for the minimum stake limit
    uint256 public constant MIN_STAKE_LIMIT = 1 ether;

    /// @notice A state variable to keep the minimum amount of stake
    uint256 public minStake;

    IRewardPool public rewardPool;

    modifier onlyRewardPool() {
        if (msg.sender != address(rewardPool)) revert Unauthorized("REWARD_POOL");
        _;
    }

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by Hydra client at genesis to set up the initial set.
     * @dev only callable by client, can only be called once
     */
    function initialize(
        StakerInit[] calldata initialStakers,
        uint256 newMinStake,
        address newLiquidToken,
        address newRewardPool
    ) external initializer onlySystemCall {
        __LiquidStaking_init(newLiquidToken);
        _initialize(initialStakers, newMinStake, newRewardPool);
    }

    function _initialize(StakerInit[] calldata initialStakers, uint256 newMinStake, address newRewardPool) private {
        _changeMinStake(newMinStake);
        rewardPool = IRewardPool(newRewardPool);
        // set initial validators
        for (uint256 i = 0; i < initialStakers.length; i++) {
            _stake(initialStakers[i].addr, initialStakers[i].stake);
        }
    }

    // _______________ External functions _______________

    function totalDelegationOf(address validator) external view returns (uint256) {
        return rewardPool.totalDelegationOf(validator);
    }

    /**
     * @notice Data type for the banned validators' withdrawals
     * @param liquidTokens The amount of liquid tokens to be taken on withdrawal from the penalized validator
     * @param withdrawableAmount The amount that is available for withdrawal after validator's penalty
     */
    struct WithdrawalInfo {
        uint256 liquidTokens;
        uint256 withdrawableAmount;
    }

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
        (uint256 validatorStakeLeft, uint256 totalStakeLeft) = _unstake(validator, unstakeAmount);
        uint256 syncAmount = totalStakeLeft;
        if (validatorStakeLeft == 0) {
            validatorManagerContract.deactivateValidator(msg.sender);
            syncAmount = validatorStakeLeft;
        }

        uint256 amountLeftToWithdraw = rewardPool.onUnstake(validator, unstakeAmount, validatorStakeLeft);
        for (uint256 i = 0; i < penaltyRewards.length; i++) {
            PenaltyReward memory reward = penaltyRewards[0];
            if (amountLeftToWithdraw < reward.amount) {
                _handleWithdrawal(reward.account, amountLeftToWithdraw);
                amountLeftToWithdraw = 0;
                break;
            }

            _handleWithdrawal(reward.account, reward.amount);
            amountLeftToWithdraw -= reward.amount;
        }

        if (amountLeftToWithdraw > 0) {
            withdrawalBalances[validator].liquidTokens += unstakeAmount;
            withdrawalBalances[validator].withdrawableAmount += amountLeftToWithdraw;
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

    /**
     * @inheritdoc IHydraStaking
     */
    function stake() external payable {
        _stake(msg.sender, msg.value);
    }

    /**
     * @inheritdoc IHydraStaking
     */
    function stakeWithVesting(uint256 durationWeeks) external payable {
        _stake(msg.sender, msg.value);
        rewardPool.onNewStakePosition(msg.sender, durationWeeks);
    }

    /**
     * @inheritdoc IHydraStaking
     */
    function unstake(uint256 amount) external {
        (uint256 validatorStakeLeft, uint256 totalStakeLeft) = _unstake(msg.sender, amount);
        uint256 syncAmount = totalStakeLeft;
        if (validatorStakeLeft == 0) {
            validatorManagerContract.deactivateValidator(msg.sender);
            syncAmount = validatorStakeLeft;
        }

        StateSyncer._syncStake(msg.sender, syncAmount);
        LiquidStaking._collectTokens(msg.sender, amount);
        uint256 amountToWithdraw = rewardPool.onUnstake(msg.sender, amount, validatorStakeLeft);
        _registerWithdrawal(msg.sender, amountToWithdraw);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @inheritdoc IHydraStaking
     */
    function changeMinStake(uint256 newMinStake) external onlyOwner {
        _changeMinStake(newMinStake);
    }

    // _______________ Internal functions _______________

    function _stake(address account, uint256 amount) internal {
        uint256 currentBalance = balanceOf(account);
        if (amount + currentBalance < minStake) revert StakeRequirement({src: "stake", msg: "STAKE_TOO_LOW"});

        _increaseAccountBalance(account, amount);
        StateSyncer._syncStake(account, currentBalance + amount);
        LiquidStaking._distributeTokens(account, amount);

        if (currentBalance == 0) {
            validatorManagerContract.activateValidator(msg.sender);
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

    function _changeMinStake(uint256 newMinStake) private {
        if (newMinStake < MIN_STAKE_LIMIT) revert InvalidMinStake();
        minStake = newMinStake;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
