// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {IStaking} from "./../../IStaking.sol";
import {Withdrawal} from "./../../modules/Withdrawal/Withdrawal.sol";
import {APRCalculator} from "./../../modules/APRCalculator/APRCalculator.sol";

import {Governed} from "./../../../common/Governed/Governed.sol";

import {Delegation} from "./Delegation.sol";
import {LiquidDelegation} from "./modules/LiquidDelegation/LiquidDelegation.sol";
import {VestedDelegation} from "./modules/VestedDelegation/VestedDelegation.sol";

import {IDelegatedStaking} from "./IDelegatedStaking.sol";

contract DelegatedStaking is IDelegatedStaking, APRCalculator, Staking, Delegation, LiquidDelegation, VestedDelegation {
    function _delegate(
        address staker,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, LiquidDelegation, VestedDelegation) {
        super._delegate(staker, delegator, amount);
    }

    function _undelegate(
        address validator,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, LiquidDelegation, VestedDelegation) {
        super._undelegate(validator, delegator, amount);
    }
}
