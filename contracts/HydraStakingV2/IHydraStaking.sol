// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "./IStaking.sol";
import {ILiquidStaking} from "./modules/LiquidStaking/ILiquidStaking.sol";
import {IDelegatedStaking} from "./modules/DelegatedStaking/IDelegatedStaking.sol";

struct StakerInit {
    address addr;
    uint256 stake;
}

interface IHydraStaking is IStaking, ILiquidStaking, IDelegatedStaking {}
