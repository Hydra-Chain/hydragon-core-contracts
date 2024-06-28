// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {StakingConnector} from "./../StakingConnector/StakingConnector.sol";
import {ValidatorManager, ValidatorStatus} from "./../ValidatorManager/ValidatorManager.sol";
import {Unauthorized} from "./../../../common/Errors.sol";
import {IInspector} from "./IInspector.sol";
import {PenalizedStakeDistribution} from "./../../../HydraStaking/modules/PenalizeableStaking/IPenalizeableStaking.sol";

abstract contract Inspector is IInspector, StakingConnector, ValidatorManager {
    /// @notice The penalty that will be taken and burned from the bad valiator's staked amount
    uint256 public validatorPenalty;
    /// @notice The reward for the person who reports a validator that have to be banned
    uint256 public reporterReward;
    /// @notice Validator inactiveness (in blocks) threshold that needs to be passed to ban a validator
    uint256 public banThreshold;

    // _______________ Initializer _______________

    function __Inspector_init() internal onlyInitializing {
        __Inspector_init_unchained();
    }

    function __Inspector_init_unchained() internal onlyInitializing {
        validatorPenalty = 700 ether;
        reporterReward = 300 ether;
        banThreshold = 123428; // the approximate number of blocks for 72 hours
    }

    // _______________ Modifiers _______________

    // Only address that is banned
    modifier onlyBanned(address account) {
        if (validators[account].status == ValidatorStatus.Banned) revert Unauthorized("UNBANNED_VALIDATOR");
        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IInspector
     */
    function banValidator(address validator) external {
        if (!isSubjectToBan(validator)) {
            revert NoBanSubject();
        }

        _ban(validator);
    }

    /**
     * @inheritdoc IInspector
     */
    function setValidatorPenalty(uint256 newPenalty) external onlyOwner {
        validatorPenalty = newPenalty;
    }

    /**
     * @inheritdoc IInspector
     */
    function setReporterReward(uint256 newReward) external onlyOwner {
        reporterReward = newReward;
    }

    /**
     * @inheritdoc IInspector
     */
    function setBanThreshold(uint256 newThreshold) external onlyOwner {
        banThreshold = newThreshold;
    }

    // _______________ Public functions _______________

    /**
     * @notice Returns if a given validator is subject to a ban
     * @dev override this function to apply your custom rules
     */
    function isSubjectToBan(address account) public virtual returns (bool);

    // _______________ Private functions _______________

    /**
     * @dev A method that executes the actions for the actual ban
     * @param validator The address of the validator
     */
    function _ban(address validator) private {
        uint256 validatorStake = stakingContract.stakeOf(validator);
        if (validators[validator].status == ValidatorStatus.Active) {
            PenalizedStakeDistribution[] memory rewards;
            if (msg.sender != owner()) {
                rewards = new PenalizedStakeDistribution[](2);
                rewards[0] = PenalizedStakeDistribution({account: msg.sender, amount: reporterReward});
                rewards[1] = PenalizedStakeDistribution({account: address(0), amount: validatorPenalty});
            } else {
                rewards = new PenalizedStakeDistribution[](1);
                rewards[0] = PenalizedStakeDistribution({account: address(0), amount: validatorPenalty});
            }

            stakingContract.penalizeStaker(validator, validatorStake, rewards);
        }

        validators[validator].status = ValidatorStatus.Banned;

        emit ValidatorBanned(validator);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
