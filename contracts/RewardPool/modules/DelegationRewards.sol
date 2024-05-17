// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Vesting.sol";
import "./RewardsWithdrawal.sol";

import "./../RewardPoolBase.sol";
import "./../libs/DelegationPoolLib.sol";
import "./../libs/VestingPositionLib.sol";

import "./../../common/Errors.sol";

abstract contract DelegationRewards is RewardPoolBase, Vesting, RewardsWithdrawal {
    using DelegationPoolLib for DelegationPool;
    using VestingPositionLib for VestingPosition;

    /// @notice A constant for the minimum delegation limit
    uint256 public constant MIN_DELEGATION_LIMIT = 1 ether;
    /// @notice Keeps the delegation pools
    mapping(address => DelegationPool) public delegationPools;
    // @note maybe this must be part of the ValidatorSet
    /// @notice The minimum delegation amount to be delegated
    uint256 public minDelegation;

    error InvalidMinDelegation();

    // _______________ Initializer _______________

    function __DelegationRewards_init(uint256 newMinDelegation) internal onlyInitializing {
        __DelegationRewards_init_unchained(newMinDelegation);
    }

    function __DelegationRewards_init_unchained(uint256 newMinDelegation) internal onlyInitializing {
        _changeMinDelegation(newMinDelegation);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IRewardPool
     */
    function delegationOf(address validator, address delegator) external view returns (uint256) {
        DelegationPool storage delegation = delegationPools[validator];

        return delegation.balanceOf(delegator);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function totalDelegationOf(address validator) external view returns (uint256) {
        return delegationPools[validator].supply;
    }

    /**
     * @inheritdoc IRewardPool
     */
    function getDelegatorReward(address validator, address delegator) external view returns (uint256) {
        DelegationPool storage delegation = delegationPools[validator];
        uint256 reward = delegation.claimableRewards(delegator);
        return _applyCustomReward(reward);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function getDelegatorPositionReward(
        address validator,
        address delegator,
        uint256 epochNumber,
        uint256 topUpIndex
    ) external view returns (uint256 sumReward) {
        VestingPosition memory position = delegationPositions[validator][delegator];
        if (_noRewardConditions(position)) {
            return 0;
        }

        DelegationPool storage delegationPool = delegationPools[validator];
        bool rsi = true;
        if (_isTopUpMade(validator, delegator)) {
            rsi = false;
            RewardParams memory params = beforeTopUpParams[validator][delegator];
            uint256 rsiReward = delegationPool.claimableRewards(
                delegator,
                params.rewardPerShare,
                params.balance,
                params.correction
            );
            sumReward += _applyCustomReward(position, rsiReward, true);
        }

        // distribute the proper vesting reward
        (uint256 epochRPS, uint256 balance, int256 correction) = _rewardParams(
            validator,
            delegator,
            epochNumber,
            topUpIndex
        );

        uint256 reward = delegationPool.claimableRewards(delegator, epochRPS, balance, correction);
        reward = _applyCustomReward(position, reward, rsi);
        sumReward += reward;

        // If the full maturing period is finished, withdraw also the reward made after the vesting period
        if (block.timestamp > position.end + position.duration) {
            uint256 additionalReward = delegationPool.claimableRewards(delegator) - sumReward;
            additionalReward = _applyCustomReward(additionalReward);
            sumReward += additionalReward;
        }
    }

    /**
     * @inheritdoc IRewardPool
     */
    function calculatePositionPenalty(
        address validator,
        address delegator,
        uint256 amount
    ) external view returns (uint256 penalty) {
        VestingPosition memory position = delegationPositions[validator][delegator];
        if (position.isActive()) {
            penalty = _calcSlashing(position, amount);
        }
    }

    /**
     * @inheritdoc IRewardPool
     */
    function calculateTotalPositionReward(address validator, address delegator) external view returns (uint256 reward) {
        VestingPosition memory position = delegationPositions[validator][delegator];
        reward = _applyCustomReward(position, getRawDelegatorReward(validator, delegator), true);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function getDelegationPoolParamsHistory(
        address validator,
        address delegator
    ) external view returns (DelegationPoolParams[] memory) {
        return delegationPoolParamsHistory[validator][delegator];
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onNewValidator(address validator) external onlyValidatorSet {
        delegationPools[validator].validator = validator;
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onDelegate(address validator, address delegator, uint256 amount) external onlyValidatorSet {
        DelegationPool storage delegation = delegationPools[validator];

        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (delegatedAmount + amount < minDelegation)
            revert DelegateRequirement({src: "delegate", msg: "DELEGATION_TOO_LOW"});

        _claimDelegatorReward(validator, delegator);
        delegation.deposit(delegator, amount);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onUndelegate(address validator, address delegator, uint256 amount) external onlyValidatorSet {
        DelegationPool storage delegation = delegationPools[validator];

        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (amount > delegatedAmount) revert DelegateRequirement({src: "undelegate", msg: "INSUFFICIENT_BALANCE"});

        uint256 amounAfterUndelegate = delegatedAmount - amount;
        if (amounAfterUndelegate < minDelegation && amounAfterUndelegate != 0)
            revert DelegateRequirement({src: "undelegate", msg: "DELEGATION_TOO_LOW"});

        _claimDelegatorReward(validator, delegator);

        delegation.withdraw(delegator, amount);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onNewDelegatePosition(
        address validator,
        address delegator,
        uint256 durationWeeks,
        uint256 currentEpochId,
        uint256 amount
    ) external onlyValidatorSet {
        DelegationPool storage delegation = delegationPools[validator];
        uint256 balance = delegation.balanceOf(delegator);
        uint256 newBalance = balance + amount;
        if (newBalance < minDelegation) revert DelegateRequirement({src: "vesting", msg: "DELEGATION_TOO_LOW"});

        VestingPosition memory position = delegationPositions[validator][delegator];
        if (position.isMaturing()) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_MATURING"});
        }

        if (position.isActive()) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_ACTIVE"});
        }

        // ensure previous rewards are claimed
        if (delegation.claimableRewards(delegator) > 0) {
            revert DelegateRequirement({src: "vesting", msg: "REWARDS_NOT_CLAIMED"});
        }

        // If is a position which is not active and not in maturing state,
        // we can recreate/create the position
        delegation.deposit(delegator, amount);
        uint256 duration = durationWeeks * 1 weeks;
        delete delegationPoolParamsHistory[validator][delegator];
        delete beforeTopUpParams[validator][delegator];
        // TODO: calculate end of period instead of write in in the cold storage. It is cheaper
        delegationPositions[validator][delegator] = VestingPosition({
            duration: duration,
            start: block.timestamp,
            end: block.timestamp + duration,
            base: base,
            vestBonus: getVestingBonus(durationWeeks),
            rsiBonus: uint248(rsi)
        });

        // keep the change in the delegation pool params per account
        _addNewDelegationPoolParam(
            validator,
            delegator,
            DelegationPoolParams({
                balance: newBalance,
                correction: delegation.correctionOf(delegator),
                epochNum: currentEpochId
            })
        );
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onTopUpDelegatePosition(
        address validator,
        address delegator,
        uint256 currentEpochId,
        uint256 amount
    ) external onlyValidatorSet {
        DelegationPool storage delegation = delegationPools[validator];
        uint256 balance = delegation.balanceOf(delegator);
        uint256 newBalance = balance + amount;
        if (newBalance < minDelegation) revert DelegateRequirement({src: "vesting", msg: "DELEGATION_TOO_LOW"});

        if (!_isTopUpMade(validator, delegator)) {
            _saveFirstTopUp(validator, delegator, delegation, balance);
        }

        delegation.deposit(delegator, amount);

        _topUpDelegatePosition(validator, delegator, delegation, currentEpochId, amount);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function onCutPosition(
        address validator,
        address delegator,
        uint256 amount,
        uint256 currentEpochId
    ) external onlyValidatorSet returns (uint256 penalty, uint256 fullReward) {
        DelegationPool storage delegation = delegationPools[validator];
        uint256 delegatedAmount = delegation.balanceOf(delegator);
        if (amount > delegatedAmount) revert DelegateRequirement({src: "vesting", msg: "INSUFFICIENT_BALANCE"});

        uint256 delegatedAmountLeft = delegatedAmount - amount;
        if (delegatedAmountLeft < minDelegation && delegatedAmountLeft != 0)
            revert DelegateRequirement({src: "vesting", msg: "DELEGATION_TOO_LOW"});

        delegation.withdraw(delegator, amount);
        VestingPosition memory position = delegationPositions[validator][delegator];
        if (position.isActive()) {
            penalty = _calcSlashing(position, amount);
            // apply the max Vesting bonus, because the full reward must be burned
            fullReward = applyMaxReward(delegation.claimRewards(delegator));

            // if position is closed when active, top-up must not be available as well as reward must not be available
            // so we delete the vesting data
            if (delegatedAmountLeft == 0) {
                delete delegationPositions[validator][delegator];
                delete delegationPoolParamsHistory[validator][delegator];
            } else {
                // keep the change in the account pool params
                uint256 balance = delegation.balanceOf(delegator);
                int256 correction = delegation.correctionOf(delegator);
                _onAccountParamsChange(validator, delegator, balance, correction, currentEpochId);
            }
        }

        if (fullReward != 0) {
            _burnAmount(fullReward);
        }
    }

    /**
     * @inheritdoc IRewardPool
     */
    function claimDelegatorReward(address validator) public {
        _claimDelegatorReward(validator, msg.sender);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function claimPositionReward(address validator, address to, uint256 epochNumber, uint256 topUpIndex) external {
        VestingPosition memory position = delegationPositions[validator][msg.sender];
        if (_noRewardConditions(position)) {
            return;
        }

        uint256 sumReward;
        uint256 sumMaxReward;
        DelegationPool storage delegationPool = delegationPools[validator];
        bool rsi = true;
        if (_isTopUpMade(validator, msg.sender)) {
            rsi = false;
            RewardParams memory params = beforeTopUpParams[validator][msg.sender];
            uint256 rsiReward = delegationPool.claimRewards(
                msg.sender,
                params.rewardPerShare,
                params.balance,
                params.correction
            );
            uint256 maxRsiReward = applyMaxReward(rsiReward);
            sumReward += _applyCustomReward(position, rsiReward, true);
            sumMaxReward += maxRsiReward;
        }

        // distribute the proper vesting reward
        (uint256 epochRPS, uint256 balance, int256 correction) = _rewardParams(
            validator,
            msg.sender,
            epochNumber,
            topUpIndex
        );

        uint256 reward = delegationPool.claimRewards(msg.sender, epochRPS, balance, correction);
        uint256 maxReward = applyMaxReward(reward);
        reward = _applyCustomReward(position, reward, rsi);
        sumReward += reward;
        sumMaxReward += maxReward;

        // If the full maturing period is finished, withdraw also the reward made after the vesting period
        if (block.timestamp > position.end + position.duration) {
            uint256 additionalReward = delegationPool.claimRewards(msg.sender);
            uint256 maxAdditionalReward = applyMaxReward(additionalReward);
            additionalReward = _applyCustomReward(additionalReward);
            sumReward += additionalReward;
            sumMaxReward += maxAdditionalReward;
        }

        uint256 remainder = sumMaxReward - sumReward;
        if (remainder > 0) {
            _burnAmount(remainder);
        }

        if (sumReward == 0) return;

        _withdrawRewards(to, sumReward);

        emit PositionRewardClaimed(msg.sender, validator, sumReward);
    }

    /**
     * @inheritdoc IRewardPool
     */
    function changeMinDelegation(uint256 newMinDelegation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _changeMinDelegation(newMinDelegation);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IRewardPool
     */
    function getRawDelegatorReward(address validator, address delegator) public view returns (uint256) {
        DelegationPool storage delegation = delegationPools[validator];
        return delegation.claimableRewards(delegator);
    }

    // TODO: Check if the commitEpoch is the last transaction in the epoch, otherwise bug may occur
    /**
     * @notice Checks if balance change was already made in the current epoch
     * @param validator Validator to delegate to
     */
    function isBalanceChangeMade(
        address validator,
        address delegator,
        uint256 currentEpochNum
    ) public view returns (bool) {
        uint256 length = delegationPoolParamsHistory[validator][delegator].length;
        if (length == 0) {
            return false;
        }

        DelegationPoolParams memory data = delegationPoolParamsHistory[validator][delegator][length - 1];
        if (data.epochNum == currentEpochNum) {
            return true;
        }

        return false;
    }

    // _______________ Private functions _______________

    function _changeMinDelegation(uint256 newMinDelegation) private {
        if (newMinDelegation < MIN_DELEGATION_LIMIT) revert InvalidMinDelegation();
        minDelegation = newMinDelegation;
    }

    function _noRewardConditions(VestingPosition memory position) private view returns (bool) {
        // If still unused position, there is no reward
        if (position.start == 0) {
            return true;
        }

        // if the position is still active, there is no matured reward
        if (position.isActive()) {
            return true;
        }

        return false;
    }

    function _isTopUpMade(address validator, address manager) private view returns (bool) {
        return beforeTopUpParams[validator][manager].balance != 0;
    }

    function _rewardParams(
        address validator,
        address manager,
        uint256 epochNumber,
        uint256 topUpIndex
    ) private view returns (uint256 rps, uint256 balance, int256 correction) {
        VestingPosition memory position = delegationPositions[validator][manager];
        uint256 matureEnd = position.end + position.duration;
        uint256 alreadyMatured;
        // If full mature period is finished, the full reward up to the end of the vesting must be matured
        if (matureEnd < block.timestamp) {
            alreadyMatured = position.end;
        } else {
            // rewardPerShare must be fetched from the history records
            uint256 maturedPeriod = block.timestamp - position.end;
            alreadyMatured = position.start + maturedPeriod;
        }

        RPS memory rpsData = historyRPS[validator][epochNumber];
        if (rpsData.timestamp == 0) {
            revert DelegateRequirement({src: "vesting", msg: "INVALID_EPOCH"});
        }

        // If the given RPS is for future time - it is wrong, so revert
        if (rpsData.timestamp > alreadyMatured) {
            revert DelegateRequirement({src: "vesting", msg: "WRONG_RPS"});
        }

        uint256 rewardPerShare = rpsData.value;
        (uint256 balanceData, int256 correctionData) = _getAccountParams(validator, manager, epochNumber, topUpIndex);

        return (rewardPerShare, balanceData, correctionData);
    }

    function _topUpDelegatePosition(
        address validator,
        address delegator,
        DelegationPool storage delegation,
        uint256 currentEpochId,
        uint256 amount
    ) private {
        if (!delegationPositions[validator][delegator].isActive()) {
            revert DelegateRequirement({src: "vesting", msg: "POSITION_NOT_ACTIVE"});
        }

        if (delegationPoolParamsHistory[validator][delegator].length > 52) {
            revert DelegateRequirement({src: "vesting", msg: "TOO_MANY_TOP_UPS"});
        }

        // keep the change in the account pool params
        uint256 balance = delegation.balanceOf(delegator);
        int256 correction = delegation.correctionOf(delegator);

        _onAccountParamsChange(validator, delegator, balance, correction, currentEpochId);
        // Modify end period of position, decrease RSI bonus
        // balance / old balance = increase coefficient
        // apply increase coefficient to the vesting period to find the increase in the period
        // TODO: Optimize gas costs
        uint256 timeIncrease;
        uint256 oldBalance = balance - amount;
        uint256 duration = delegationPositions[validator][delegator].duration;
        if (amount >= oldBalance) {
            timeIncrease = duration;
        } else {
            timeIncrease = (amount * duration) / oldBalance;
        }

        delegationPositions[validator][delegator].duration = duration + timeIncrease;
        delegationPositions[validator][delegator].end = delegationPositions[validator][delegator].end + timeIncrease;
    }

    function _claimDelegatorReward(address validator, address delegator) private {
        DelegationPool storage delegation = delegationPools[validator];
        uint256 reward = delegation.claimRewards(delegator);
        reward = _applyCustomReward(reward);
        if (reward == 0) return;

        emit DelegatorRewardClaimed(validator, delegator, reward);

        _withdrawRewards(delegator, reward);
    }

    function _addNewDelegationPoolParam(
        address validator,
        address delegator,
        DelegationPoolParams memory params
    ) private {
        if (isBalanceChangeMade(validator, delegator, params.epochNum)) {
            // Top up can be made only once per epoch
            revert StakeRequirement({src: "_addNewDelegationPoolParam", msg: "BALANCE_CHANGE_ALREADY_MADE"});
        }

        delegationPoolParamsHistory[validator][delegator].push(params);
    }

    function _saveFirstTopUp(
        address validator,
        address delegator,
        DelegationPool storage delegation,
        uint256 balance
    ) private {
        int256 correction = delegation.magnifiedRewardCorrections[delegator];
        uint256 rewardPerShare = delegation.magnifiedRewardPerShare;
        beforeTopUpParams[validator][delegator] = RewardParams({
            rewardPerShare: rewardPerShare,
            balance: balance,
            correction: correction
        });
    }

    function _onAccountParamsChange(
        address validator,
        address delegator,
        uint256 balance,
        int256 correction,
        uint256 currentEpochId
    ) private {
        if (isBalanceChangeMade(validator, delegator, currentEpochId)) {
            // Top up can be made only once on epoch
            revert DelegateRequirement({src: "_onAccountParamsChange", msg: "BALANCE_CHANGE_ALREADY_MADE"});
        }

        delegationPoolParamsHistory[validator][delegator].push(
            DelegationPoolParams({balance: balance, correction: correction, epochNum: currentEpochId})
        );
    }

    function _getAccountParams(
        address validator,
        address manager,
        uint256 epochNumber,
        uint256 paramsIndex
    ) private view returns (uint256 balance, int256 correction) {
        if (paramsIndex >= delegationPoolParamsHistory[validator][manager].length) {
            revert DelegateRequirement({src: "vesting", msg: "INVALID_TOP_UP_INDEX"});
        }

        DelegationPoolParams memory params = delegationPoolParamsHistory[validator][manager][paramsIndex];
        if (params.epochNum > epochNumber) {
            revert DelegateRequirement({src: "vesting", msg: "LATER_TOP_UP"});
        } else if (params.epochNum == epochNumber) {
            // If balance change is made exactly in the epoch with the given index - it is the valid one for sure
            // because the balance change is made exactly before the distribution of the reward in this epoch
        } else {
            // This is the case where the balance change is  before the handled epoch (epochNumber)
            if (paramsIndex == delegationPoolParamsHistory[validator][manager].length - 1) {
                // If it is the last balance change - don't check does the next one can be better
            } else {
                // If it is not the last balance change - check does the next one can be better
                // We just need the right account specific pool params for the given RPS, to be able
                // to properly calculate the reward
                DelegationPoolParams memory nextParamsRecord = delegationPoolParamsHistory[validator][manager][
                    paramsIndex + 1
                ];
                if (nextParamsRecord.epochNum <= epochNumber) {
                    // If the next balance change is made in an epoch before the handled one or in the same epoch
                    // and is bigger than the provided balance change - the provided one is not valid.
                    // Because when the reward was distributed for the given epoch, the account balance was different
                    revert DelegateRequirement({src: "vesting", msg: "EARLIER_TOP_UP"});
                }
            }
        }

        return (params.balance, params.correction);
    }

    function _burnAmount(uint256 amount) private {
        (bool success, ) = address(0).call{value: amount}("");
        require(success, "Failed to burn amount");
    }
}
