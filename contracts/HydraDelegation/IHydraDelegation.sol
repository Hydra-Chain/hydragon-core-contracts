// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ILiquid} from "../common/Liquid/ILiquid.sol";
import {IVestedDelegation} from "./modules/VestedDelegation/IVestedDelegation.sol";
import {IDelegation} from "./IDelegation.sol";

interface IHydraDelegation is IDelegation, IVestedDelegation, ILiquid {
    event CommissionUpdated(address indexed staker, uint256 newCommission);

    error InvalidCommission(uint256 commission);

    /**
     * @notice Sets commission for staker.
     * @dev Anyone can set commission, but if the caller is not active validator, it will not have any effect.
     * @param newCommission New commission (100 = 100%)
     */
    function setCommission(uint256 newCommission) external;

    /**
     * @notice Returns commission for staker.
     * @param staker Address of the validator
     * @return commission Commission for staker
     */
    function stakerDelegationCommission(address staker) external view returns (uint256);

    /**
     * @notice Distributes rewards to delegators.
     * @param staker Address of the validator
     * @param reward Amount of rewards to distribute
     * @param epochId Epoch ID
     */
    function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) external;
}
