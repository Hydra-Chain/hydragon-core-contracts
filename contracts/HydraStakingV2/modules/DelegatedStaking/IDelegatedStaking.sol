// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "./../../IStaking.sol";
import {ILiquid} from "./../common/Liquid/ILiquid.sol";
import {IDelegation} from "./IDelegation.sol";
import {IVestedDelegation} from "./modules/VestedDelegation/IVestedDelegation.sol";

interface IDelegatedStaking is IStaking, IDelegation, IVestedDelegation, ILiquid {}
