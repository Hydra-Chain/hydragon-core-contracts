// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ILiquid} from "../common/Liquid/ILiquid.sol";
import {IVestedDelegation} from "./modules/VestedDelegation/IVestedDelegation.sol";
import {IDelegation} from "./IDelegation.sol";

interface IHydraDelegation is IDelegation, IVestedDelegation, ILiquid {
    /**
     * @notice Distributes rewards to delegators.
     * @param staker Address of the validator
     * @param reward Amount of rewards to distribute
     * @param epochId Epoch ID
     */
    function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) external;
}
