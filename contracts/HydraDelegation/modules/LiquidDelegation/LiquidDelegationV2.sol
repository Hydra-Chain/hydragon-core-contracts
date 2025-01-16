// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {StakerInit} from "../../../HydraStaking/IHydraStaking.sol";
import {Delegation} from "../../Delegation.sol";
import {LiquidV2} from "../../../common/Liquid/LiquidV2.sol";

abstract contract LiquidDelegationV2 is Delegation, LiquidV2 {
    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __LiquidDelegation_init(
        StakerInit[] calldata initialStakers,
        uint256 initialCommission,
        address governance,
        address aprCalculatorAddr,
        address hydraChainAddr,
        address hydraStakingAddr,
        address rewardWalletAddr,
        address liquidToken
    ) internal onlyInitializing {
        __Liquid_init(liquidToken);
        __Delegation_init(
            initialStakers,
            initialCommission,
            governance,
            aprCalculatorAddr,
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
