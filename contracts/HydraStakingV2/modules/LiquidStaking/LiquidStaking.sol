// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {ILiquidityToken} from "./../../../LiquidityToken/ILiquidityToken.sol";
import {ILiquidStaking} from "./ILiquidStaking.sol";

/**
 * @title LiquidStaking
 * @notice An extension of the Staking contract that enables the distribution of liquid tokens to stakers and delegators
 */
abstract contract LiquidStaking is ILiquidStaking, Staking {
    mapping(address => uint256) public stakersliquidityDebts;

    /// Liquid Staking token given to stakers and delegators
    address internal _liquidToken;

    function __LiquidStaking_init(address newLiquidToken) internal onlyInitializing {
        __LiquidStaking_init_unchained(newLiquidToken);
    }

    function __LiquidStaking_init_unchained(address newLiquidToken) internal onlyInitializing {
        _liquidToken = newLiquidToken;
    }

    // _______________ External functions _______________

    function liquidToken() external view returns (address) {
        return _liquidToken;
    }

    // _______________ Internal functions _______________

    function _stake(address account, uint256 amount) internal override {
        super._stake(account, amount);
        _distributeTokens(account, amount);
    }

    function _unstake(address account, uint256 amount) internal override returns (uint256, uint256) {
        _collectTokens(account, amount);

        return super._unstake(account, amount);
    }

    function _distributeTokens(address staker, uint256 stakedAmount) internal virtual {
        _mintTokens(staker, stakedAmount);
    }

    function _collectTokens(address staker, uint256 unstakedAmount) internal virtual {
        // User needs to burn the liquid tokens for slashed stake as well
        uint256 liquidDebt = stakersliquidityDebts[staker];
        if (liquidDebt > 0) {
            stakersliquidityDebts[staker] = 0;
            unstakedAmount += liquidDebt;
        }

        _burnTokens(staker, unstakedAmount);
    }

    function _collectDelegatorTokens(address delegator, uint256 unstakedAmount) internal {
        _burnTokens(delegator, unstakedAmount);
    }

    function _mintTokens(address account, uint256 amount) private {
        ILiquidityToken(_liquidToken).mint(account, amount);
    }

    function _burnTokens(address account, uint256 amount) private {
        ILiquidityToken(_liquidToken).burn(account, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
