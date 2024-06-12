// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {IPowerExponent, PowerExponentStore} from "./IPowerExponent.sol";

abstract contract PowerExponent is IPowerExponent, Ownable2StepUpgradeable {
    PowerExponentStore public powerExponent;

    function __PowerExponent_init() internal onlyInitializing {
        __PowerExponent_init_unchained();
    }

    function __PowerExponent_init_unchained() internal onlyInitializing {
        powerExponent = PowerExponentStore({value: 5000, pendingValue: 0});
    }

    /**
     * @inheritdoc IPowerExponent
     */
    function getExponent() external view returns (uint256 numerator, uint256 denominator) {
        return (powerExponent.value, 10000);
    }

    /**
     * @inheritdoc IPowerExponent
     */
    function updateExponent(uint256 newValue) external onlyOwner {
        require(newValue > 4999 && newValue < 10001, "0.5 <= Exponent <= 1");

        powerExponent.pendingValue = uint128(newValue);
    }

    /**
     * @notice Apply pending value if any
     *
     * @dev Execute when commit epoch
     */
    function _applyPendingExp() internal {
        PowerExponentStore memory data = powerExponent;
        if (data.pendingValue != 0) {
            data.value = data.pendingValue;
            data.pendingValue = 0;

            powerExponent = data;
        }
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
