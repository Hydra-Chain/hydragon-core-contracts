// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "./../../IStaking.sol";
import {ILiquid} from "./../common/Liquid/ILiquid.sol";

struct PenalizedStakeDistribution {
    address account;
    uint256 amount;
}

/**
 * @notice Data type for the banned validators' withdrawals
 * @param liquidTokens The amount of liquid tokens to be taken on withdrawal from the penalized validator
 * @param withdrawableAmount The amount that is available for withdrawal after validator's penalty
 */
struct WithdrawalInfo {
    uint256 liquidTokens;
    uint256 withdrawableAmount;
}

interface IPenalizeableStaking is IStaking {}
