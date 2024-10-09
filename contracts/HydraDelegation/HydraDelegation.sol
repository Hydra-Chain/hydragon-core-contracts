// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {System} from "../common/System/System.sol";
import {SafeMathUint} from "../common/libs/SafeMathUint.sol";
import {StakerInit} from "../HydraStaking/IHydraStaking.sol";
import {VestingPosition} from "../common/Vesting/IVesting.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {HydraStakingConnector} from "../HydraStaking/HydraStakingConnector.sol";
import {RewardWalletConnector} from "../RewardWallet/RewardWalletConnector.sol";
import {LiquidDelegation} from "./modules/LiquidDelegation/LiquidDelegation.sol";
import {VestedDelegation} from "./modules/VestedDelegation/VestedDelegation.sol";
import {IHydraDelegation} from "./IHydraDelegation.sol";
import {Delegation} from "./Delegation.sol";
import {DelegationPool} from "./modules/DelegationPoolLib/DelegationPoolLib.sol";

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
    using SafeMathUint for uint256;

    /// @notice A constant for the maximum comission a validator can receive from the delegator's rewards
    uint256 public constant MAX_COMMISSION = 100;
    uint256 public constant DENOMINATOR = 10000;

    /// A fraction's numerator representing the rate
    /// at which the liquidity tokens' distribution is decreased on a weekly basis
    uint256 public vestingLiquidityDecreasePerWeek;
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
        address rewardWalletAddr
    ) external initializer onlySystemCall {
        __APRCalculatorConnector_init(aprCalculatorAddr);
        __HydraStakingConnector_init(hydraStakingAddr);
        __Delegation_init(governance, rewardWalletAddr);
        __LiquidDelegation_init(liquidToken);
        __VestedDelegation_init(vestingManagerFactoryAddr, hydraChainAddr);

        _initialize(initialStakers, initialCommission);
    }

    function _initialize(StakerInit[] calldata initialStakers, uint256 initialCommission) private {
        vestingLiquidityDecreasePerWeek = 133; // 0.0133
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
     * This function is called to distribute tokens to a delegator. If the delegator is opening a vested position,
     * the amount of liquid tokens distributed is decreased based on the vesting duration. Specifically, the amount is
     * reduced by a percentage per week of vesting. The corresponding negative debt is also added to the account's liquidity debts,
     * ensuring that the user must return the appropriate decreased amount.
     */
    function _distributeTokens(address staker, address account, uint256 amount) internal virtual override {
        VestingPosition memory position = vestedDelegationPositions[staker][msg.sender];
        if (_isDelegateWithVesting(position)) {
            uint256 positionDurationInWeeks = position.duration / 1 weeks;
            uint256 debt = (amount * positionDurationInWeeks * vestingLiquidityDecreasePerWeek) / DENOMINATOR;
            liquidityDebts[account] -= debt.toInt256Safe(); // Add negative debt
            amount -= debt;
        }

        super._distributeTokens(staker, account, amount);
    }

    function _depositDelegation(
        address staker,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, VestedDelegation) {
        super._depositDelegation(staker, delegation, delegator, amount);
    }

    function _withdrawDelegation(
        address staker,
        DelegationPool storage delegation,
        address delegator,
        uint256 amount
    ) internal virtual override(Delegation, VestedDelegation) {
        super._withdrawDelegation(staker, delegation, delegator, amount);
    }

    // _______________ Private functions _______________

    function _isDelegateWithVesting(VestingPosition memory position) private view returns (bool) {
        return position.start == block.timestamp;
    }

    /**
     * @notice Set commission for staker
     * @param staker Address of the validator
     * @param newCommission New commission (100 = 100%)
     */
    function _setCommission(address staker, uint256 newCommission) private {
        if (newCommission > MAX_COMMISSION) revert InvalidCommission(newCommission);

        delegationCommissionPerStaker[staker] = newCommission;

        emit CommissionUpdated(staker, newCommission);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
