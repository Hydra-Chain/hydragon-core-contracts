// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IBLS} from "../../../BLS/IBLS.sol";
import {Unauthorized} from "../../../common/Errors.sol";
import {PenalizedStakeDistribution} from "../../../HydraStaking/modules/PenalizeableStaking/IPenalizeableStaking.sol";
import {ValidatorManager, ValidatorStatus, ValidatorInit} from "../ValidatorManager/ValidatorManager.sol";
import {IInspector} from "./IInspector.sol";

abstract contract Inspector is IInspector, ValidatorManager {
    /// @notice The penalty that will be taken and burned from the bad validator's staked amount
    uint256 public validatorPenalty;
    /// @notice The reward for the person who reports a validator that have to be banned
    uint256 public reporterReward;
    /// @notice Threshold for validator inactiveness (in blocks).
    /// A ban can be initiated for a validator if this threshold is reached or exceeded.
    /// @dev must be always bigger than the epoch length (better bigger than at least 4 epochs),
    /// otherwise all validators can be banned
    uint256 public initiateBanThreshold;
    /// @notice Threshold for validator inactiveness (in seconds). A validator can be banned
    /// if it remains in the ban-initiated state for a duration equal to or exceeding this threshold.
    uint256 public banThreshold;
    /// @notice Mapping of the validators that bans has been initiated for (validator => timestamp)
    mapping(address => uint256) public bansInitiated;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Inspector_init(
        ValidatorInit[] calldata newValidators,
        IBLS newBls,
        address hydraStakingAddr,
        address hydraDelegationAddr,
        address governance
    ) internal onlyInitializing {
        __ValidatorManager_init(newValidators, newBls, hydraStakingAddr, hydraDelegationAddr, governance);
        __Inspector_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Inspector_init_unchained() internal onlyInitializing {
        initiateBanThreshold = 18000; // in blocks => 1 hour minimum
        validatorPenalty = 700 ether;
        reporterReward = 300 ether;
        banThreshold = 24 hours;
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
    function initiateBan(address validator) external {
        if (bansInitiated[validator] != 0) {
            revert BanAlreadyInitiated();
        }

        if (!isSubjectToInitiateBan(validator)) {
            revert NoInitiateBanSubject();
        }

        bansInitiated[validator] = block.timestamp;
        hydraStakingContract.temporaryEjectValidator(validator);
        hydraDelegationContract.lockCommissionReward(validator);
    }

    /**
     * @inheritdoc IInspector
     */
    function terminateBanProcedure() external {
        if (bansInitiated[msg.sender] == 0) {
            revert NoBanInitiated();
        }

        bansInitiated[msg.sender] = 0;
        _updateParticipation(msg.sender);
        hydraStakingContract.recoverEjectedValidator(msg.sender);
        hydraDelegationContract.unlockCommissionReward(msg.sender);
    }

    /**
     * @inheritdoc IInspector
     */
    function banValidator(address validator) external {
        if (!isSubjectToFinishBan(validator)) {
            revert NoBanSubject();
        }

        if (bansInitiated[validator] != 0) {
            bansInitiated[validator] = 0;
        }

        if (_isGovernance(msg.sender)) {
            hydraDelegationContract.lockCommissionReward(validator);
        }

        _ban(validator);
    }

    /**
     * @inheritdoc IInspector
     */
    function setValidatorPenalty(uint256 newPenalty) external onlyGovernance {
        validatorPenalty = newPenalty;
    }

    /**
     * @inheritdoc IInspector
     */
    function setReporterReward(uint256 newReward) external onlyGovernance {
        reporterReward = newReward;
    }

    /**
     * @inheritdoc IInspector
     */
    function setInitiateBanThreshold(uint256 newThreshold) external onlyGovernance {
        initiateBanThreshold = newThreshold;
    }

    /**
     * @inheritdoc IInspector
     */
    function setBanThreshold(uint256 newThreshold) external onlyGovernance {
        banThreshold = newThreshold;
    }

    /**
     * @inheritdoc IInspector
     */
    function banIsInitiated(address validator) external view returns (bool) {
        return bansInitiated[validator] != 0;
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IInspector
     */
    function isSubjectToFinishBan(address account) public view returns (bool) {
        if (validators[account].status == ValidatorStatus.Banned) {
            return false;
        }

        // check if the owner (governance) is calling
        if (_isGovernance(msg.sender)) {
            return true;
        }

        uint256 banInitiatedTimestamp = bansInitiated[account];
        if (banInitiatedTimestamp == 0 || block.timestamp - banInitiatedTimestamp < banThreshold) {
            return false;
        }

        return true;
    }

    /**
     * @notice Returns if a ban process can be initiated for a given validator
     * @dev This function is overridden in the hydra chain contract
     * @param account The address of the validator
     * @return Returns true if the validator is subject to initiate ban
     */
    function isSubjectToInitiateBan(address account) public virtual returns (bool);

    // _______________ Private functions _______________

    /**
     * @dev A method that executes the actions for the actual ban
     * @param validator The address of the validator
     */
    function _ban(address validator) private {
        if (validators[validator].status == ValidatorStatus.Active) {
            PenalizedStakeDistribution[] memory rewards;
            if (_isGovernance(msg.sender)) {
                rewards = new PenalizedStakeDistribution[](1);
                rewards[0] = PenalizedStakeDistribution({account: address(0), amount: validatorPenalty});
            } else {
                rewards = new PenalizedStakeDistribution[](2);
                rewards[0] = PenalizedStakeDistribution({account: msg.sender, amount: reporterReward});
                rewards[1] = PenalizedStakeDistribution({account: address(0), amount: validatorPenalty});
            }

            hydraStakingContract.penalizeStaker(validator, rewards);
            activeValidatorsCount--;
        }

        validators[validator].status = ValidatorStatus.Banned;

        emit ValidatorBanned(validator);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
