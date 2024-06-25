// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Delegation} from "./Delegation.sol";
import {LiquidDelegation} from "./modules/LiquidDelegation/LiquidDelegation.sol";
import {VestedDelegation} from "./modules/VestedDelegation/VestedDelegation.sol";
import {APRCalculatorConnector} from "./../APRCalculator/APRCalculatorConnector.sol";
import {IHydraDelegation} from "./IHydraDelegation.sol";
import {StakerInit} from "./../HydraStaking/IHydraStaking.sol";
import {HydraStakingConnector} from "./../HydraStakingV2/HydraStakingConnector.sol";

contract HydraDelegation is
    IHydraDelegation,
    APRCalculatorConnector,
    HydraStakingConnector,
    Delegation,
    LiquidDelegation,
    VestedDelegation
{
    /// @notice A constant for the maximum comission a validator can receive from the delegator's rewards
    uint256 public constant MAX_COMMISSION = 100;

    mapping(address => uint256) public delegationCommissionPerStaker;

    // _______________ Initializer _______________

    // TODO: Move commision to Delegation module
    function __DelegatedStaking_init(
        StakerInit[] calldata initialStakers,
        uint256 initialCommission
    ) internal onlyInitializing {
        __DelegatedStaking_init_unchained(initialStakers, initialCommission);
    }

    function __DelegatedStaking_init_unchained(
        StakerInit[] calldata initialStakers,
        uint256 initialCommission
    ) internal onlyInitializing {
        for (uint256 i = 0; i < initialStakers.length; i++) {
            _setCommission(initialStakers[i].addr, initialCommission);
        }
    }

    function stakerDelegationCommission(address staker) external view returns (uint256) {
        return delegationCommissionPerStaker[staker];
    }

    function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) external onlyHydraStaking {
        _distributeDelegationRewards(staker, reward, epochId);
    }

    /**
     * @inheritdoc IHydraDelegation
     */
    function setCommission(uint256 newCommission) external {
        _setCommission(msg.sender, newCommission);
    }

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

    function _setCommission(address staker, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission(newCommission);

        delegationCommissionPerStaker[staker] = newCommission;

        emit CommissionUpdated(staker, newCommission);
    }
}
