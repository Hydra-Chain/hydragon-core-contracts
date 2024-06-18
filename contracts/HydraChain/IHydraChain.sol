// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IInspector} from "./modules/Inspector/IInspector.sol";
import {IPowerExponent} from "./modules/PowerExponent/IPowerExponent.sol";
import {IValidatorManager} from "./modules/ValidatorManager/IValidatorManager.sol";
import {IEpochManager} from "./modules/EpochManager/IEpochManager.sol";

interface IHydraChain is IInspector, IEpochManager, IValidatorManager, IPowerExponent {}
