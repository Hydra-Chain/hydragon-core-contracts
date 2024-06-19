// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "./../../IStaking.sol";
import {ILiquid} from "./../common/Liquid/ILiquid.sol";
import {IDelegation} from "./IDelegation.sol";
import {IVestedDelegation} from "./modules/VestedDelegation/IVestedDelegation.sol";

interface IDelegatedStaking is IStaking, IDelegation, IVestedDelegation, ILiquid {
    event CommissionUpdated(address indexed validator, uint256 newCommission);

    error InvalidCommission(uint256 commission);

    /**
     * @notice Sets commission for validator.
     * @param newCommission New commission (100 = 100%)
     */
    function setCommission(uint256 newCommission) external;
}
