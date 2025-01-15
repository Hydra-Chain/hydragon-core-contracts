// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {System} from "../common/System/System.sol";
import {SafeMathUint} from "../common/libs/SafeMathUint.sol";
import {StakerInit} from "../HydraStaking/IHydraStaking.sol";
import {VestingPosition} from "../common/Vesting/IVesting.sol";
import {LiquidDelegation} from "./modules/LiquidDelegation/LiquidDelegation.sol";
import {VestedDelegation} from "./modules/VestedDelegation/VestedDelegation.sol";
import {IHydraDelegation} from "./IHydraDelegation.sol";
import {Delegation} from "./Delegation.sol";
import {DelegationPool} from "./modules/DelegationPoolLib/DelegationPoolLib.sol";

contract HydraDelegationV2 is IHydraDelegation, System, Delegation, LiquidDelegation, VestedDelegation {
    using SafeMathUint for uint256;

    // _______________ Initializer _______________

    function initialize(
        StakerInit[] calldata initialStakers,
        uint256 initialCommission,
        address governance,
        address aprCalculatorAddr,
        address hydraChainAddr,
        address hydraStakingAddr,
        address vestingManagerFactoryAddr,
        address rewardWalletAddr,
        address liquidToken
    ) external initializer onlySystemCall {
        __Delegation_init(
            initialStakers,
            initialCommission,
            governance,
            aprCalculatorAddr,
            hydraChainAddr,
            hydraStakingAddr,
            rewardWalletAddr
        );
        __Liquid_init(liquidToken);
        __Vesting_init_unchained();
        __VestingManagerFactoryConnector_init(vestingManagerFactoryAddr);
        __VestedDelegation_init_unchained();
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IHydraDelegation
     */
    function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) external onlyHydraStaking {
        _distributeDelegationRewards(staker, reward, epochId);
    }

    // _______________ Internal functions _______________

    /**
     * @inheritdoc Delegation
     */
    function _delegate(
        address staker,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, LiquidDelegation, VestedDelegation) {
        super._delegate(staker, delegator, amount);
    }

    /**
     * @inheritdoc Delegation
     */
    function _undelegate(
        address staker,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, LiquidDelegation, VestedDelegation) {
        super._undelegate(staker, delegator, amount);
    }

    /**
     * This function is called to distribute tokens to a delegator. If the delegator is opening a vested position,
     * the amount of liquid tokens distributed is decreased based on the vesting duration. Specifically, the amount is
     * reduced by a percentage per week of vesting. The corresponding negative debt is also added to the account's liquidity debts,
     * ensuring that the user must return the appropriate decreased amount.
     */
    function _distributeTokens(address staker, address account, uint256 amount) internal virtual override {
        VestingPosition memory position = vestedDelegationPositions[staker][msg.sender];
        if (_isOpeningPosition(position)) {
            uint256 previousDelegation = delegationOf(staker, account) - amount;
            if (previousDelegation != 0) {
                // We want all previously distributed tokens to be collected,
                // because the new position vesting period can be different from the previous one
                // meaning the tokens to distribute amount will be different
                _collectTokens(staker, previousDelegation);
                amount += previousDelegation;
            }

            uint256 debt = _calculatePositionDebt(amount, position.duration);
            liquidityDebts[account] -= debt.toInt256Safe(); // Add negative debt
            amount -= debt;
        }

        super._distributeTokens(staker, account, amount);
    }

    /**
     * @inheritdoc Delegation
     */
    function _depositDelegation(
        address staker,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, VestedDelegation) {
        super._depositDelegation(staker, delegation, delegator, amount);
    }

    /**
     * @inheritdoc Delegation
     */
    function _withdrawDelegation(
        address staker,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, VestedDelegation) {
        super._withdrawDelegation(staker, delegation, delegator, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
