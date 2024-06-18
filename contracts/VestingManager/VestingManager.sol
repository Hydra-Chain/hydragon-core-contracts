// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IHydraStaking} from "./../HydraStakingV2/IHydraStaking.sol";

contract VestingManager is Initializable, OwnableUpgradeable {
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
        IHydraStaking(delegation).delegateWithVesting{value: msg.value}(validator, durationWeeks);
        _sendLiquidTokens(msg.sender, msg.value);
    }

    function cutVestedDelegatePosition(address validator, uint256 amount) external payable onlyOwner {
        _cutVestedPosition(validator, amount);
    }

    function cutVestedDelegatePositionWithPermit(
        address validator,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable onlyOwner {
        address liquidToken = IHydraStaking(delegation).liquidToken();
        IERC20Permit(liquidToken).permit(msg.sender, address(this), amount, deadline, v, r, s);
        _cutVestedPosition(validator, amount);
    }

    function swapVestedPositionValidator(address oldValidator, address newValidator) external onlyOwner {
        IHydraStaking(delegation).swapVestedPositionValidator(oldValidator, newValidator);
    }

    function claimVestedPositionReward(
        address validator,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external payable onlyOwner {
        IHydraStaking(rewardPool).claimPositionReward(validator, msg.sender, epochNumber, balanceChangeIndex);
    }

    function withdraw(address to) external {
        IHydraStaking(delegation).withdraw(to);
    }

    // _______________ Public functions _______________

    // _______________ Internal functions _______________

    function _cutVestedPosition(address validator, uint256 amount) internal {
        _fulfillLiquidTokens(msg.sender, amount);
        IHydraStaking(delegation).undelegateWithVesting(validator, amount);
    }

    // _______________ Private functions _______________

    /**
     * Sends the received after stake liquid tokens to the position owner
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount staked amount
     */
    function _sendLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        address liquidToken = IHydraStaking(delegation).liquidToken();
        IERC20(liquidToken).safeTransfer(positionOwner, amount);
    }

    /**
     * Fulfill position with the needed liquid tokens
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount Amount to be unstaked
     */
    function _fulfillLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        address liquidToken = IHydraStaking(delegation).liquidToken();
        IERC20(liquidToken).safeTransferFrom(positionOwner, address(this), amount);
    }
}
