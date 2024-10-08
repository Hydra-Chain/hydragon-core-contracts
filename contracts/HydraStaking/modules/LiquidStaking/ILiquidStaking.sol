// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ILiquid} from "../../../common/Liquid/ILiquid.sol";
import {IStaking} from "../../IStaking.sol";

// solhint-disable-next-line no-empty-blocks
interface ILiquidStaking is IStaking, ILiquid {}
