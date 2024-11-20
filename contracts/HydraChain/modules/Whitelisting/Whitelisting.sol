// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Governed} from "../../../common/Governed/Governed.sol";
import {IWhitelisting} from "./IWhitelisting.sol";

abstract contract Whitelisting is IWhitelisting, Governed {
    mapping(address => bool) public isWhitelisted;
    bool public isWhitelistingEnabled;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __Whitelisting_init(address _governance) internal onlyInitializing {
        __Governed_init(_governance);
        __Whitelisting_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Whitelisting_init_unchained() internal onlyInitializing {
        isWhitelistingEnabled = true;
    }

    // _______________ Modifiers _______________

    /**
     * @dev Checks if whitelisting is enabled and if the sender is whitelisted.
     */
    modifier onlyWhitelisted() {
        if (isWhitelistingEnabled && !isWhitelisted[msg.sender]) revert MustBeWhitelisted();
        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IWhitelisting
     */
    function enableWhitelisting() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isWhitelistingEnabled) revert WhitelistingAlreadyEnabled();
        isWhitelistingEnabled = true;
    }

    /**
     * @inheritdoc IWhitelisting
     */
    function disableWhitelisting() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!isWhitelistingEnabled) revert WhitelistingAlreadyDisabled();
        isWhitelistingEnabled = false;
    }

    /**
     * @inheritdoc IWhitelisting
     */
    function addToWhitelist(address[] calldata whitelistAddresses) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < whitelistAddresses.length; i++) {
            _addToWhitelist(whitelistAddresses[i]);
        }
    }

    /**
     * @inheritdoc IWhitelisting
     */
    function removeFromWhitelist(address[] calldata whitelistAddresses) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < whitelistAddresses.length; i++) {
            _removeFromWhitelist(whitelistAddresses[i]);
        }
    }

    // _______________ Internal functions _______________

    function _addToWhitelist(address account) internal {
        if (isWhitelisted[account]) revert PreviouslyWhitelisted();
        isWhitelisted[account] = true;

        emit AddedToWhitelist(account);
    }

    function _removeFromWhitelist(address account) internal {
        if (!isWhitelisted[account]) revert MustBeWhitelisted();
        isWhitelisted[account] = false;

        emit RemovedFromWhitelist(account);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
