// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IRewardPool.sol";
import "./../common/Errors.sol";

/**
 * @title RewarPoolBase
 * @notice the base state variables and functionality needed in different modules that the ValidatorSet uses.
 */
abstract contract RewardPoolBase is IRewardPool, Initializable {
    /// @notice The address of the ValidatorSet contract
    IValidatorSet public validatorSet;

    // _______________ Modifiers _______________

    modifier onlyValidatorSet() {
        if (msg.sender != address(validatorSet)) revert Unauthorized("VALIDATORSET");
        _;
    }

    // _______________ Initializer _______________

    function __RewardPoolBase_init(IValidatorSet newValidatorSet) internal onlyInitializing {
        __RewardPoolBase_init_unchained(newValidatorSet);
    }

    function __RewardPoolBase_init_unchained(IValidatorSet newValidatorSet) internal onlyInitializing {
        validatorSet = newValidatorSet;
    }
}
