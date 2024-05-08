// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./IInspector.sol";
import "./../Staking/Staking.sol";
import "./../../../common/Errors.sol";

abstract contract Inspector is IInspector, Staking {
    /// @notice The penalty that will be taken and burned from the bad valiator's staked amount
    uint256 public validatorPenalty = 700 ether;

    /// @notice The reward for the person who reports a validator that have to be banned
    uint256 public reporterReward = 300 ether;

    // _______________ External functions _______________

    /**
     * @inheritdoc IInspector
     */
    function banValidator(address validator) external onlyOwner {
        if (validator == address(0)) revert ZeroAddress();
        if (validators[validator].status != ValidatorStatus.Registered) revert Unauthorized("UNREGISTERED_VALIDATOR");

        uint256 stakedAmount = balanceOf(validator);
        if (stakedAmount < validatorPenalty) revert LowStake();

        _burnPenalty(validator);

        uint256 unstakeAmount = stakedAmount - validatorPenalty;
        _handleValidatorUnstake(validator, unstakeAmount);

        validators[validator].status = ValidatorStatus.Banned;

        emit ValidatorBanned(validator);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IInspector
     */
    function setValidatorPenalty(uint256 newPenalty) public onlyOwner {
        validatorPenalty = newPenalty;
    }

    /**
     * @inheritdoc IInspector
     */
    function setReporterReward(uint256 newReward) public onlyOwner {
        reporterReward = newReward;
    }

    // _______________ Private functions _______________

    function _burnPenalty(address validator) private {
        _burn(validator, validatorPenalty);
        LiquidStaking._collectTokens(validator, validatorPenalty);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
