// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Unauthorized, StakeRequirement} from "./../common/Errors.sol";
import {Staking} from "./Staking.sol";
import {System} from "./../common/System/System.sol";
import {LiquidStaking} from "./modules/LiquidStaking/LiquidStaking.sol";
import {ValidatorManagerConnector} from "./modules/ValidatorManagerConnector.sol";
import {IHydraStaking, StakerInit} from "./IHydraStaking.sol";

// TODO: An optimization we can do is keeping only once the general apr params for a block so we don' have to keep them for every single user

contract HydraStaking is IHydraStaking, Staking, LiquidStaking, System, ValidatorManagerConnector {
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

    function _stake(address account, uint256 amount) internal override(Staking, LiquidStaking) {
        if (stakeOf(account) == 0) {
            validatorManagerContract.activateValidator(account);
        }

        super._stake(account, amount);
    }

    function _unstake(
        address account,
        uint256 amount
    ) internal override(Staking, LiquidStaking) returns (uint256 validatorStakeLeft) {
        uint256 stakeLeft = super._unstake(account, amount);
        if (validatorStakeLeft == 0) {
            validatorManagerContract.deactivateValidator(account);
        }
    }
}
