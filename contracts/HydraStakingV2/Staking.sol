// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Withdrawal} from "./modules/Withdrawal/Withdrawal.sol";
import {Unauthorized, StakeRequirement} from "./../common/Errors.sol";
import {IStaking, StakingReward} from "./IStaking.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

contract Staking is IStaking, Initializable, Ownable2StepUpgradeable, Withdrawal {
    /// @notice A constant for the minimum stake limit
    uint256 public constant MIN_STAKE_LIMIT = 1 ether;

    /// @notice A state variable to keep the minimum amount of stake
    uint256 public minStake;
    uint256 public totalStake;
    mapping(address => uint256) public stakes;
    /// @notice The staking rewards mapped to a staker's address
    mapping(address => StakingReward) public stakingRewards;

    // _______________ Initializer _______________

    function __Staking_init(uint256 newMinStake) internal onlyInitializing {
        __Staking_init_unchained(newMinStake);
    }

    function __Staking_init_unchained(uint256 newMinStake) internal onlyInitializing {
        _changeMinStake(newMinStake);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IStaking
     */
    function stake() external payable {
        _stake(msg.sender, msg.value);
    }

    /**
     * @inheritdoc IStaking
     */
    function unstake(uint256 amount) external {
        _unstake(msg.sender, amount);
        _registerWithdrawal(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    function claimStakingRewards() external {
        uint256 reward = unclaimedRewards(msg.sender);
        if (reward == 0) {
            return;
        }

        stakingRewards[msg.sender].taken += reward;
        _withdraw(msg.sender, reward);

        emit StakingRewardsClaimed(msg.sender, reward);
    }

    /**
     * @inheritdoc IStaking
     */
    function changeMinStake(uint256 newMinStake) external onlyOwner {
        _changeMinStake(newMinStake);
    }

    // _______________ Public functions _______________

    function stakeOf(address account) public view returns (uint256) {
        return stakes[account];
    }

    function unclaimedRewards(address account) public view returns (uint256) {
        return stakingRewards[account].total - stakingRewards[account].taken;
    }

    // _______________ Internal functions _______________

    function _stake(address account, uint256 amount) internal virtual {
        uint256 currentBalance = stakeOf(account);
        if (amount + currentBalance < minStake) revert StakeRequirement({src: "stake", msg: "STAKE_TOO_LOW"});

        stakes[account] += amount;

        emit Staked(account, amount);
    }

    function _unstake(address account, uint256 amount) internal virtual returns (uint256 validatorStakeLeft) {
        uint256 validatorStake = stakeOf(account);
        if (amount > validatorStake) revert StakeRequirement({src: "unstake", msg: "INSUFFICIENT_BALANCE"});

        validatorStakeLeft = validatorStake - amount;
        if (validatorStakeLeft < minStake && validatorStakeLeft != 0)
            revert StakeRequirement({src: "unstake", msg: "STAKE_TOO_LOW"});

        stakes[account] = validatorStakeLeft;
    }

    // _______________ Private functions _______________

    function _changeMinStake(uint256 newMinStake) private {
        if (newMinStake < MIN_STAKE_LIMIT) revert InvalidMinStake();
        minStake = newMinStake;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
