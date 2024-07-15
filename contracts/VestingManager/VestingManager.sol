// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IHydraDelegation} from "./../HydraDelegation/IHydraDelegation.sol";

contract VestingManager is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    /// @notice The hydra delegation contract
    IHydraDelegation public immutable HYDRA_DELEGATION;

    // _______________ Constructor _______________

    constructor(address hydraDelegationAddr) {
        // Set the HydraDelegation contract as part of the code (because immutable) when implementation is deployed.
        // That way, we don't have to set it separately in every proxy we create later.
        HYDRA_DELEGATION = IHydraDelegation(hydraDelegationAddr);
        _disableInitializers();
    }

    // _______________ Initializer _______________

    function initialize(address owner) public initializer {
        _transferOwnership(owner);
    }

    // _______________ External functions _______________

    function openVestedDelegatePosition(address staker, uint256 durationWeeks) external payable onlyOwner {
        HYDRA_DELEGATION.delegateWithVesting{value: msg.value}(staker, durationWeeks);
        _sendLiquidTokens(msg.sender, msg.value);
    }

    function cutVestedDelegatePosition(address staker, uint256 amount) external payable onlyOwner {
        _cutVestedPosition(staker, amount);
    }

    function cutVestedDelegatePositionWithPermit(
        address staker,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable onlyOwner {
        address liquidToken = HYDRA_DELEGATION.liquidToken();
        IERC20Permit(liquidToken).permit(msg.sender, address(this), amount, deadline, v, r, s);
        _cutVestedPosition(staker, amount);
    }

    function swapVestedPositionStaker(address oldStaker, address newStaker) external onlyOwner {
        HYDRA_DELEGATION.swapVestedPositionStaker(oldStaker, newStaker);
    }

    function claimVestedPositionReward(
        address staker,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external payable onlyOwner {
        HYDRA_DELEGATION.claimPositionReward(staker, msg.sender, epochNumber, balanceChangeIndex);
    }

    function withdraw(address to) external {
        HYDRA_DELEGATION.withdraw(to);
    }

    // _______________ Internal functions _______________

    function _cutVestedPosition(address staker, uint256 amount) internal {
        _fulfillLiquidTokens(msg.sender, amount);
        HYDRA_DELEGATION.undelegateWithVesting(staker, amount);
    }

    // _______________ Private functions _______________

    /**
     * Sends the received after stake liquid tokens to the position owner
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount staked amount
     */
    function _sendLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        address liquidToken = HYDRA_DELEGATION.liquidToken();
        IERC20(liquidToken).safeTransfer(positionOwner, amount);
    }

    /**
     * Fulfill position with the needed liquid tokens
     * @param positionOwner Owner of the position (respectively of the position manager)
     * @param amount Amount to be unstaked
     */
    function _fulfillLiquidTokens(address positionOwner, uint256 amount) private onlyOwner {
        address liquidToken = HYDRA_DELEGATION.liquidToken();
        IERC20(liquidToken).safeTransferFrom(positionOwner, address(this), amount);
    }
}
