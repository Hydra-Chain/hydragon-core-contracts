// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {Liquid} from "./../../../common/Liquid/Liquid.sol";
import {ILiquidityToken} from "./../../../LiquidityToken/ILiquidityToken.sol";

/**
 * @title LiquidStaking
 * @notice An extension of the Staking contract that enables the distribution of liquid tokens to stakers
 */
contract LiquidStaking is Staking, Liquid {
    // _______________ Internal functions _______________

    function _stake(address account, uint256 amount) internal virtual override {
        super._stake(account, amount);
        _distributeTokens(account, amount);
    }

    function _unstake(address account, uint256 amount) internal virtual override returns (uint256, uint256) {
        _collectTokens(account, amount);

        return super._unstake(account, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
