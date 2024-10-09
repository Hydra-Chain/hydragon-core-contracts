// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {SafeMathUint} from "../../common/libs/SafeMathUint.sol";
import {ILiquidityToken} from "../../LiquidityToken/ILiquidityToken.sol";
import {ILiquid} from "./ILiquid.sol";

/**
 * @title Liquid
 * @notice An extension of the Staking contract that enables the distribution of liquid tokens
 */
abstract contract Liquid is ILiquid, Initializable {
    using SafeMathUint for uint256;

    mapping(address => int256) public liquidityDebts;

    /// Liquid Staking token given to stakers and delegators
    address internal _liquidToken;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __LiquidStaking_init(address newLiquidToken) internal onlyInitializing {
        __LiquidStaking_init_unchained(newLiquidToken);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __LiquidStaking_init_unchained(address newLiquidToken) internal onlyInitializing {
        _liquidToken = newLiquidToken;
    }

    // _______________ External functions _______________

    function liquidToken() external view returns (address) {
        return _liquidToken;
    }

    /**
     * @inheritdoc ILiquid
     */
    function calculateOwedLiquidTokens(address account, uint256 amount) external view returns (uint256) {
        int256 liquidDebt = liquidityDebts[account];
        int256 amountInt = amount.toInt256Safe();
        int256 amountAfterDebt = amountInt + liquidDebt;

        if (amountAfterDebt < 1) {
            return 0;
        }

        return uint256(amountAfterDebt);
    }

    // _______________ Internal functions _______________

    function _collectTokens(address account, uint256 amount) internal virtual {
        // User needs to provide their liquid tokens debt as well
        int256 liquidDebt = liquidityDebts[account];
        int256 amountInt = amount.toInt256Safe();
        int256 amountAfterDebt = amountInt + liquidDebt;
        // if negative debt is bigger than or equal to the amount, so we get the whole amount from the debt
        if (amountAfterDebt < 1) {
            liquidityDebts[account] -= amountInt;
            amount = 0;

            return;
        }

        // otherwise apply the whole debt to the amount
        liquidityDebts[account] = 0;
        amount = uint256(amountAfterDebt);

        _burnTokens(account, amount);
    }

    function _mintTokens(address account, uint256 amount) internal {
        ILiquidityToken(_liquidToken).mint(account, amount);
    }

    // _______________ Private functions _______________

    function _burnTokens(address account, uint256 amount) private {
        ILiquidityToken(_liquidToken).burn(account, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
