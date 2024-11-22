// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {StakerInit} from "../../../HydraStaking/IHydraStaking.sol";
import {Delegation} from "../../Delegation.sol";
import {Liquid} from "../../../common/Liquid/Liquid.sol";

abstract contract LiquidDelegation is Delegation, Liquid {
    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __LiquidDelegation_init(
        address governance,
        address aprCalculatorAddr,
        address hydraChainAddr,
        address hydraStakingAddr,
        address rewardWalletAddr,
        address liquidToken,
        StakerInit[] calldata initialStakers,
        uint256 initialCommission
    ) internal onlyInitializing {
        __Liquid_init(liquidToken);
        __Delegation_init(
            aprCalculatorAddr,
            initialStakers,
            initialCommission,
            governance,
            hydraChainAddr,
            hydraStakingAddr,
            rewardWalletAddr
        );
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
