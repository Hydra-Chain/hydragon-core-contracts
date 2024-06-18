// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ILiquid} from "./ILiquid.sol";
import {ILiquidityToken} from "./../../../../LiquidityToken/ILiquidityToken.sol";

/**
 * @title Liquid
 * @notice An extension of the Staking contract that enables the distribution of liquid tokens
 */
abstract contract Liquid is ILiquid, Initializable {
    mapping(address => uint256) public liquidityDebts;

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

    function _distributeTokens(address account, uint256 amount) internal virtual {
        _mintTokens(account, amount);
    }

    function _collectTokens(address account, uint256 amount) internal virtual {
        // User needs to burn the liquid tokens for slashed stake as well
        uint256 liquidDebt = liquidityDebts[account];
        if (liquidDebt > 0) {
            liquidityDebts[account] = 0;
            amount += liquidDebt;
        }

        _burnTokens(account, amount);
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
