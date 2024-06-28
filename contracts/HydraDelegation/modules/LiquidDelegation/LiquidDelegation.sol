// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Delegation} from "./../../Delegation.sol";
import {Liquid} from "./../../../common/Liquid/Liquid.sol";

contract LiquidDelegation is Delegation, Liquid {

    // _______________ Internal functions _______________

    /**
     * @inheritdoc Delegation
     */
    function _delegate(address staker, address delegator, uint256 amount) internal virtual override {
        super._delegate(staker, delegator, amount);
        _distributeTokens(delegator, amount);
    }

    /**
     * @inheritdoc Delegation
     */
    function _undelegate(address staker, address delegator, uint256 amount) internal virtual override {
        _collectTokens(delegator, amount);
        super._undelegate(staker, delegator, amount);
    }
}
