// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "./../../IStaking.sol";

interface ILiquidStaking is IStaking {
    /**
     * @notice Returns the address of the token that is distributed as a liquidity on stake
     */
    function liquidToken() external view returns (address);
}
