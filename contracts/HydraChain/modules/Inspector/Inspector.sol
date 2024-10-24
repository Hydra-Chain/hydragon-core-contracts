// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Unauthorized} from "../../../common/Errors.sol";
import {PenalizedStakeDistribution} from "../../../HydraStaking/modules/PenalizeableStaking/IPenalizeableStaking.sol";
import {ValidatorManager, ValidatorStatus} from "../ValidatorManager/ValidatorManager.sol";
import {IInspector} from "./IInspector.sol";

abstract contract Inspector is IInspector, ValidatorManager {
    /// @notice The penalty that will be taken and burned from the bad valiator's staked amount
    uint256 public validatorPenalty;
    /// @notice The reward for the person who reports a validator that have to be banned
    uint256 public reporterReward;
    /// @notice Validator inactiveness (in blocks) threshold that needs to be passed to initiate ban for a validator
    uint256 public initiateBanThreshold;
    /// @notice Validator inactiveness (in seconds) threshold that needs to be passed to ban a validator
    uint256 public banThreshold;
    /// @notice Mapping of the validators that bans has been initiated for (validator => timestamp)
    mapping(address => uint256) public bansInitiated;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Inspector_init() internal onlyInitializing {
        __Inspector_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Inspector_init_unchained() internal onlyInitializing {
        validatorPenalty = 700 ether;
        reporterReward = 300 ether;
        banThreshold = 24 hours;
        initiateBanThreshold = 18000; // in blocks => 1 hour minimum
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
    }

    /**
     * @inheritdoc IInspector
     */
    function terminateBanProcedure() external {
        if (bansInitiated[msg.sender] == 0) {
            revert NoBanInititated();
        }

        bansInitiated[msg.sender] = 0;
        hydraStakingContract.recoverEjectedValidator(msg.sender);
        _updateParticipation(msg.sender);
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
    function setInitiateBanThreshold(uint256 newThreshold) external onlyOwner {
        initiateBanThreshold = newThreshold;
    }

    /**
     * @inheritdoc IInspector
     */
    function setBanThreshold(uint256 newThreshold) external onlyOwner {
        banThreshold = newThreshold;
    }

    // _______________ Public functions _______________

    /**
     * @notice Returns true if a ban can be finally executed for a given validator
     * @dev override this function to apply your custom rules
     */
    function isSubjectToFinishBan(address account) public view returns (bool) {
        // check if the owner (governance) is calling
        if (msg.sender == owner()) {
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
     * @dev override this function to apply your custom rules
     * @param account The address of the validator
     * @return Returns true if the validator is subject to a ban
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
            if (msg.sender != owner()) {
                rewards = new PenalizedStakeDistribution[](2);
                rewards[0] = PenalizedStakeDistribution({account: msg.sender, amount: reporterReward});
                rewards[1] = PenalizedStakeDistribution({account: address(0), amount: validatorPenalty});
            } else {
                rewards = new PenalizedStakeDistribution[](1);
                rewards[0] = PenalizedStakeDistribution({account: address(0), amount: validatorPenalty});
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
