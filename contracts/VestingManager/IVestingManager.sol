// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IVestingManager {
    /**
     * @notice Opens a new vested delegate position & recive the liquid tokens
     * @dev The owner of the contract is the only one who can call this function
     * @param staker validator address
     * @param durationWeeks number of weeks for the vesting period
     */
    function openVestedDelegatePosition(address staker, uint256 durationWeeks) external payable;

    /**
     * @notice Cuts a vested delegate position and takes the liquid tokens from the position owner
     * @dev The owner of the contract is the only one who can call this function
     * @param staker validator address
     * @param amount amount to be cut
     */
    function cutVestedDelegatePosition(address staker, uint256 amount) external payable;

    /**
     * @notice Cuts a vested delegate position and takes the liquid tokens from the position owner
     * @dev The owner of the contract is the only one who can call this function
     * @dev The permit function is used to approve the transfer of the liquid tokens
     * @param staker validator address
     * @param amount amount to be cut
     */
    function cutVestedDelegatePositionWithPermit(
        address staker,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable;

    /**
     * @notice Swaps the staker of a vested position
     * @dev The owner of the contract is the only one who can call this function
     * @param oldStaker old staker address
     * @param newStaker new staker address
     */
    function swapVestedPositionStaker(address oldStaker, address newStaker) external;

    /**
     * @notice Claims the vested position reward from HydraDelegation contract
     * @dev The owner of the contract is the only one who can call this function
     * @param staker validator address
     * @param epochNumber epoch number
     * @param balanceChangeIndex balance change index
     */
    function claimVestedPositionReward(
        address staker,
        uint256 epochNumber,
        uint256 balanceChangeIndex
    ) external payable;

    /**
     * @notice Withdraws available hydra from HydraDelegation contract
     * @dev The owner of the contract is the only one who can call this function
     * @param to address to send hydra to
     */
    function withdraw(address to) external;
}
