// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Delegation} from "../../Delegation.sol";
import {Liquid} from "../../../common/Liquid/Liquid.sol";

abstract contract LiquidDelegation is Delegation, Liquid {
    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __LiquidDelegation_init(address _liquidToken) internal onlyInitializing {
        __LiquidStaking_init(_liquidToken);
    }

    // _______________ Internal functions _______________

    /**
     * @inheritdoc Delegation
     */
    function _delegate(address staker, address delegator, uint256 amount) internal virtual override {
        super._delegate(staker, delegator, amount);
        _distributeTokens(staker, delegator, amount);
    }

    /**
     * @inheritdoc Delegation
     */
    function _undelegate(address staker, address delegator, uint256 amount) internal virtual override {
        _collectTokens(delegator, amount);
        super._undelegate(staker, delegator, amount);
    }

    function _distributeTokens(address /* staker */, address account, uint256 amount) internal virtual {
        _mintTokens(account, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
