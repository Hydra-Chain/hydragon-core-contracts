// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "./IAccessControl.sol";
import "./../../ValidatorSetBase.sol";

abstract contract AccessControl is IAccessControl, Ownable2StepUpgradeable, ValidatorSetBase {
    // TODO: We must be able to enable/disable this feature
    function __AccessControl_init(address governance) internal onlyInitializing {
        __AccessControl_init_unchained(governance);
    }

    function __AccessControl_init_unchained(address governance) internal onlyInitializing {
        _transferOwnership(governance);
    }

    /**
     * @inheritdoc IAccessControl
     */
    function addToWhitelist(address[] calldata whitelistAddreses) external onlyOwner {
        for (uint256 i = 0; i < whitelistAddreses.length; i++) {
            _addToWhitelist(whitelistAddreses[i]);
        }
    }

    /**
     * @inheritdoc IAccessControl
     */
    function removeFromWhitelist(address[] calldata whitelistAddreses) external onlyOwner {
        for (uint256 i = 0; i < whitelistAddreses.length; i++) {
            _removeFromWhitelist(whitelistAddreses[i]);
        }
    }

    function _addToWhitelist(address account) internal {
        if (validators[account].status != ValidatorStatus.None) revert("Previously whitelisted.");
        validators[account].status = ValidatorStatus.Whitelisted;
        emit AddedToWhitelist(account);
    }

    function _removeFromWhitelist(address account) internal {
        if (validators[account].status != ValidatorStatus.Whitelisted) revert("Must be whitelisted.");
        validators[account].status = ValidatorStatus.None;
        emit RemovedFromWhitelist(account);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
