// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Unauthorized, StakeRequirement} from "./../common/Errors.sol";
import {Staking} from "./Staking.sol";
import {System} from "./../common/System/System.sol";
import {LiquidStaking} from "./modules/LiquidStaking/LiquidStaking.sol";
import {VestedStaking} from "./modules/VestedStaking/VestedStaking.sol";
import {StateSyncStaking} from "./modules/StateSyncStaking/StateSyncStaking.sol";
import {ValidatorManagerConnector} from "./modules/ValidatorManagerConnector.sol";
import {IHydraStaking, StakerInit} from "./IHydraStaking.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

contract HydraStaking is
    IHydraStaking,
    Staking,
    LiquidStaking,
    StateSyncStaking,
    VestedStaking,
    System,
    ValidatorManagerConnector
{
    // TODO: Properly set up initializers

    /**
     * @notice Initializer function for genesis contract, called by Hydra client at genesis to set up the initial set.
     * @dev only callable by client, can only be called once
     */
    function initialize(
        StakerInit[] calldata initialStakers,
        uint256 newMinStake,
        address newLiquidToken,
        address newRewardPool
    ) external initializer onlySystemCall {
        __Staking_init(newMinStake);
        __LiquidStaking_init(newLiquidToken);
        _initialize(initialStakers);
    }

    function _initialize(StakerInit[] calldata initialStakers) private {
        // set initial validators
        for (uint256 i = 0; i < initialStakers.length; i++) {
            _stake(initialStakers[i].addr, initialStakers[i].stake);
        }
    }

    function _stake(address account, uint256 amount) internal override(Staking, LiquidStaking, StateSyncStaking) {
        if (stakeOf(account) == 0) {
            validatorManagerContract.activateValidator(account);
        }

        super._stake(account, amount);
    }

    function _unstake(
        address account,
        uint256 amount
    )
        internal
        override(Staking, LiquidStaking, StateSyncStaking, VestedStaking)
        returns (uint256 stakeLeft, uint256 withdrawAmount)
    {
        (stakeLeft, withdrawAmount) = super._unstake(account, amount);
        if (stakeLeft == 0) {
            validatorManagerContract.deactivateValidator(account);
        }
    }

    function _claimStakingRewards(address staker) internal override(Staking, VestedStaking) returns (uint256 rewards) {
        return super._claimStakingRewards(staker);
    }

    function _distributeStakingReward(address account, uint256 rewardIndex) internal override(Staking, VestedStaking) {
        return super._distributeStakingReward(account, rewardIndex);
    }
}
