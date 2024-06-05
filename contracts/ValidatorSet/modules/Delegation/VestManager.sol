// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IDelegation.sol";
import "./../Withdrawal/IWithdrawal.sol";
import "./../Staking/ILiquidStaking.sol";
import "./../../../RewardPool/IRewardPool.sol";

contract VestManager is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    /// @notice The staking address
    address public delegation;
    /// @notice The reward pool address
    address public rewardPool;

    // _______________ Events _______________

    event Claimed(address indexed account, uint256 amount);

    constructor() {
        _disableInitializers();
    }

    // _______________ Initializer _______________

    function initialize(address owner, address _rewardPool) public initializer {
        _transferOwnership(owner);
        delegation = msg.sender;
        rewardPool = _rewardPool;
    }

    // _______________ External functions _______________

    function openVestedDelegatePosition(address validator, uint256 durationWeeks) external payable onlyOwner {
        IDelegation(delegation).delegateWithVesting{value: msg.value}(validator, durationWeeks);
        _sendLiquidTokens(msg.sender, msg.value);
    }

    function cutVestedDelegatePosition(address validator, uint256 amount) external payable onlyOwner {
        _fulfillLiquidTokens(msg.sender, amount);
        IDelegation(delegation).undelegateWithVesting(validator, amount);
    }

    function cutVestedDelegatePositionWithPermit(
        address validator,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable onlyOwner {
        _fulfillLiquidTokensWithPermit(msg.sender, amount, deadline, v, r, s);
        IDelegation(delegation).undelegateWithVesting(validator, amount);
    }

    function swapVestedPositionValidator(address oldValidator, address newValidator) external onlyOwner {
        IDelegation(delegation).swapVestedPositionValidator(oldValidator, newValidator);
    }

    function claimVestedPositionReward(
        address validator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external payable onlyOwner {
        IRewardPool(rewardPool).claimPositionReward(validator, msg.sender, epochNumber, balanceChangeIndex);
    }

    function withdraw(address to) external {
        IWithdrawal(delegation).withdraw(to);
    }

    // _______________ Public functions _______________

    // _______________ Internal functions _______________

    // _______________ Private functions _______________

    /**
     * Sends the received after stake liquid tokens to the position owner
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount staked amount
     */
    function _sendLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        address liquidToken = ILiquidStaking(delegation).liquidToken();
        IERC20(liquidToken).safeTransfer(positionOwner, amount);
    }

    /**
     * Fulfill position with the needed liquid tokens
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount Amount to be unstaked
     */
    function _fulfillLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        address liquidToken = ILiquidStaking(delegation).liquidToken();
        IERC20(liquidToken).safeTransferFrom(positionOwner, address(this), amount);
    }


    /**
     * Fulfill position with the needed liquid tokens using permit and signature
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount Amount to be unstaked
     * @param deadline Deadline for the permit
     * @param v Signature v
     * @param r Signature r
     * @param s Signature s
     */
    function _fulfillLiquidTokensWithPermit(
        address positionOwner,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private onlyOwner {
        address liquidToken = ILiquidStaking(delegation).liquidToken();
        IERC20Permit(liquidToken).permit(positionOwner, address(this), amount, deadline, v, r, s);
        IERC20(liquidToken).safeTransferFrom(positionOwner, address(this), amount);
    }
}
