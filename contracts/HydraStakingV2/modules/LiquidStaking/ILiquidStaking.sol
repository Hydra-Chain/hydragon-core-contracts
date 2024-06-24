// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "./../../IStaking.sol";
import {ILiquid} from "./../../../common/Liquid/ILiquid.sol";

interface ILiquidStaking is IStaking, ILiquid {}
