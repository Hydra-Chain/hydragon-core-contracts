// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IStaking} from "./IStaking.sol";
import {ILiquidStaking} from "./modules/LiquidStaking/ILiquidStaking.sol";
import {IDelegatedStaking} from "./modules/DelegatedStaking/IDelegatedStaking.sol";
import {IPenalizeableStaking} from "./modules/PenalizeableStaking/IPenalizeableStaking.sol";
import {Epoch} from "./../HydraChain/IHydraChain.sol";
import {Uptime} from "./../HydraChain/modules/ValidatorManager/IValidatorManager.sol";

struct StakerInit {
    address addr;
    uint256 stake;
}

interface IHydraStaking is IStaking, ILiquidStaking, IDelegatedStaking, IPenalizeableStaking {
    /**
     * @notice Distributes rewards for the given epoch
     * @dev Transfers funds from sender to this contract
     * @param epochId The epoch number
     * @param uptime uptime data for every validator
     * @param epochSize Number of blocks per epoch
     */
    function distributeRewardsFor(uint256 epochId, Uptime[] calldata uptime, uint256 epochSize) external payable;

    // _______________ Public functions _______________

    /**
     * @notice Returns total balance staked + delegated
     * @param staker The address of the staker
     */
    function totalBalanceOf(address staker) external view returns (uint256);

    /**
     * @notice Returns total staked balance for all stakers and delegators
     */
    function totalBalance() external view returns (uint256);
}
