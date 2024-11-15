// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20, IERC20Permit} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IHydraDelegation} from "../HydraDelegation/IHydraDelegation.sol";
import {IVestingManager} from "./IVestingManager.sol";

contract VestingManager is IVestingManager, Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    /// @notice The hydra delegation contract
    IHydraDelegation public immutable HYDRA_DELEGATION;
    IERC20 public immutable LIQUIDITY_TOKEN;

    // _______________ Constructor _______________

    constructor(address hydraDelegationAddr, address liquidityTokenAddr) {
        // Set the HydraDelegation contract as part of the code (because immutable) when implementation is deployed.
        // That way, we don't have to set it separately in every proxy we create later.
        HYDRA_DELEGATION = IHydraDelegation(hydraDelegationAddr);
        LIQUIDITY_TOKEN = IERC20(liquidityTokenAddr);
        _disableInitializers();
    }

    // _______________ Initializer _______________

    function initialize(address owner) public initializer {
        _transferOwnership(owner);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IVestingManager
     */
    function openVestedDelegatePosition(address staker, uint256 durationWeeks) external payable onlyOwner {
        HYDRA_DELEGATION.delegateWithVesting{value: msg.value}(staker, durationWeeks);
        _sendLiquidTokens(msg.sender, IERC20(LIQUIDITY_TOKEN).balanceOf(address(this)));
    }

    /**
     * @inheritdoc IVestingManager
     */
    function cutVestedDelegatePosition(address staker, uint256 amount) external payable onlyOwner {
        _cutVestedPosition(staker, amount, HYDRA_DELEGATION.calculateOwedLiquidTokens(address(this), amount));
    }

    /**
     * @inheritdoc IVestingManager
     */
    function cutVestedDelegatePositionWithPermit(
        address staker,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable onlyOwner {
        uint256 owedLiquidTokens = HYDRA_DELEGATION.calculateOwedLiquidTokens(address(this), amount);
        IERC20Permit(address(LIQUIDITY_TOKEN)).permit(msg.sender, address(this), owedLiquidTokens, deadline, v, r, s);
        _cutVestedPosition(staker, amount, owedLiquidTokens);
    }

    /**
     * @inheritdoc IVestingManager
     */
    function swapVestedPositionStaker(address oldStaker, address newStaker) external onlyOwner {
        HYDRA_DELEGATION.swapVestedPositionStaker(oldStaker, newStaker);
    }

    /**
     * @inheritdoc IVestingManager
     */
    function claimVestedPositionReward(
        address staker,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external payable onlyOwner {
        HYDRA_DELEGATION.claimPositionReward(staker, msg.sender, epochNumber, balanceChangeIndex);
    }

    /**
     * @inheritdoc IVestingManager
     */
    function withdraw(address to) external onlyOwner {
        HYDRA_DELEGATION.withdraw(to);
    }

    // _______________ Internal functions _______________

    /**
     * @notice Fulfill position with the needed tokens and undelegates
     * @param staker Staker address
     * @param amount Amount to be cut
     * @param owedLiquidTokens Amount of liquid tokens owed
     */
    function _cutVestedPosition(address staker, uint256 amount, uint256 owedLiquidTokens) internal {
        _fulfillLiquidTokens(msg.sender, owedLiquidTokens);
        HYDRA_DELEGATION.undelegateWithVesting(staker, amount);
    }

    // _______________ Private functions _______________

    /**
     * Sends the received after stake liquid tokens to the position owner
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount staked amount
     */
    function _sendLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        IERC20(LIQUIDITY_TOKEN).safeTransfer(positionOwner, amount);
    }

    /**
     * Fulfill position with the needed liquid tokens
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount Amount to be unstaked
     */
    function _fulfillLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        IERC20(LIQUIDITY_TOKEN).safeTransferFrom(positionOwner, address(this), amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
