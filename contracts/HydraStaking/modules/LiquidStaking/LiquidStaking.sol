// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Liquid} from "../../../common/Liquid/Liquid.sol";
import {Staking} from "../../Staking.sol";

/**
 * @title LiquidStaking
 * @notice An extension of the Staking contract that enables the distribution of liquid tokens to stakers
 */
abstract contract LiquidStaking is Staking, Liquid {
    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __LiquidDelegation_init(address _liquidToken) internal onlyInitializing {
        __LiquidStaking_init(_liquidToken);
    }

    // _______________ Internal functions _______________

    /*
     * @inheritdoc Staking
     */
    function _stake(address account, uint256 amount) internal virtual override {
        super._stake(account, amount);
        _distributeTokens(account, amount);
    }

    /*
     * @inheritdoc Staking
     */
    function _unstake(address account, uint256 amount) internal virtual override returns (uint256, uint256) {
        _collectTokens(account, amount);

        return super._unstake(account, amount);
    }

    function _distributeTokens(address account, uint256 amount) internal virtual {
        _mintTokens(account, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
