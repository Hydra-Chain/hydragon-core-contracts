// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ILiquid} from "./../common/Liquid/ILiquid.sol";
import {IDelegation} from "./IDelegation.sol";
import {IVestedDelegation} from "./modules/VestedDelegation/IVestedDelegation.sol";

interface IHydraDelegation is IDelegation, IVestedDelegation, ILiquid {
    event CommissionUpdated(address indexed validator, uint256 newCommission);

    error InvalidCommission(uint256 commission);

    function stakerDelegationCommission(address staker) external view returns (uint256);

    /**
     * @notice Sets commission for validator.
     * @param newCommission New commission (100 = 100%)
     */
    function setCommission(uint256 newCommission) external;

    function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) external;
}
