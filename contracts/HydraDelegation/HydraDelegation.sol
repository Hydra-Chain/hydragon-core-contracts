// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Delegation} from "./Delegation.sol";
import {System} from "./../common/System/System.sol";
import {LiquidDelegation} from "./modules/LiquidDelegation/LiquidDelegation.sol";
import {VestedDelegation} from "./modules/VestedDelegation/VestedDelegation.sol";
import {APRCalculatorConnector} from "./../APRCalculator/APRCalculatorConnector.sol";
import {HydraStakingConnector} from "./../HydraStaking/HydraStakingConnector.sol";
import {RewardWalletConnector} from "./../RewardWallet/RewardWalletConnector.sol";
import {IHydraDelegation} from "./IHydraDelegation.sol";
import {StakerInit} from "./../HydraStaking/IHydraStaking.sol";

contract HydraDelegation is
    IHydraDelegation,
    System,
    APRCalculatorConnector,
    HydraStakingConnector,
    RewardWalletConnector,
    Delegation,
    LiquidDelegation,
    VestedDelegation
{
    /// @notice A constant for the maximum comission a validator can receive from the delegator's rewards
    uint256 public constant MAX_COMMISSION = 100;

    mapping(address => uint256) public delegationCommissionPerStaker;

    // _______________ Initializer _______________

    function initialize(
        StakerInit[] calldata initialStakers,
        address governance,
        uint256 initialCommission,
        address liquidToken,
        address aprCalculatorAddr,
        address hydraStakingAddr,
        address hydraChainAddr,
        address vestingManagerFactoryAddr,
        address rewardWalletConnectorAddr
    ) external initializer onlySystemCall {
        __APRCalculatorConnector_init(aprCalculatorAddr);
        __HydraStakingConnector_init(hydraStakingAddr);
        __Delegation_init(governance, rewardWalletConnectorAddr);
        __LiquidDelegation_init(liquidToken);
        __VestedDelegation_init(vestingManagerFactoryAddr, hydraChainAddr);

        _initialize(initialStakers, initialCommission);
    }

    function _initialize(StakerInit[] calldata initialStakers, uint256 initialCommission) private {
        for (uint256 i = 0; i < initialStakers.length; i++) {
            _setCommission(initialStakers[i].addr, initialCommission);
        }
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IHydraDelegation
     */
    function setCommission(uint256 newCommission) external {
        _setCommission(msg.sender, newCommission);
    }

    /**
     * @inheritdoc IHydraDelegation
     */
    function stakerDelegationCommission(address staker) external view returns (uint256) {
        return delegationCommissionPerStaker[staker];
    }

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
     * @notice Set commission for staker
     * @param staker Address of the validator
     * @param newCommission New commission (100 = 10%)
     */
    function _setCommission(address staker, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission(newCommission);

        delegationCommissionPerStaker[staker] = newCommission;

        emit CommissionUpdated(staker, newCommission);
    }
}
