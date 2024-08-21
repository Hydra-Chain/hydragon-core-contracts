// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {InvalidPrice} from "../../../common/Errors.sol";
import {System} from "../../../common/System/System.sol";
import {Governed} from "../../../common/Governed/Governed.sol";
import {HydraChainConnector} from "../../../HydraChain/HydraChainConnector.sol";
import {PriceOracleConnector} from "../../../PriceOracle/PriceOracleConnector.sol";
import {IPrice} from "./IPrice.sol";

abstract contract Price is IPrice, Initializable, System, Governed, HydraChainConnector, PriceOracleConnector {
    uint256 public constant DENOMINATOR = 10000;
    bytes32 public constant MANAGER_ROLE = keccak256("manager_role");

    bool public disabledBonusesUpdates;
    uint256 public latestDailyPrice;
    uint256[] public updatedPrices;
    mapping(uint256 => uint256) public pricePerDay;

    // _______________ Initializer _______________

    function __Price_init(
        address _hydraChainAddr,
        address _priceOracleAddr,
        address _governance,
        uint256[310] memory _prices
    ) internal onlyInitializing {
        __Governed_init(_governance);
        __HydraChainConnector_init(_hydraChainAddr);
        __PriceOracleConnector_init(_priceOracleAddr);
        __Price_init_unchained(_prices);

        _grantRole(MANAGER_ROLE, _governance);
    }

    function __Price_init_unchained(uint256[310] memory _prices) internal onlyInitializing {
        updatedPrices = _prices;
        latestDailyPrice = _prices[309];
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IPrice
     */
    function updatePrice(uint256 _price, uint256 _day) external onlyPriceOracle {
        if (_price == 0) revert InvalidPrice();
        if (pricePerDay[_day] != 0) revert PriceAlreadySet();
        if (_day != block.timestamp / 1 days) revert InvalidDay();

        latestDailyPrice = _price;
        pricePerDay[_day] = _price;

        emit PriceUpdated(_day, _price);

        if (!disabledBonusesUpdates) {
            _updateBonuses(_price);
        }
    }

    /**
     * @inheritdoc IPrice
     */
    function guardBonuses() external onlyRole(MANAGER_ROLE) {
        if (disabledBonusesUpdates) {
            revert GuardAlreadyEnabled();
        }

        disabledBonusesUpdates = true;
        _resetBonuses();
    }

    /**
     * @inheritdoc IPrice
     */
    function disableGuard() external onlyRole(MANAGER_ROLE) {
        if (!disabledBonusesUpdates) {
            revert GuardAlreadyDisabled();
        }

        disabledBonusesUpdates = false;
    }

    // _______________ Internal functions _______________

    /**
     * @notice Triggers bonus updates based on the price.
     */
    function _onPriceUpdate(uint256 _price) internal virtual;

    /**
     * @notice Reset bonuses to their default values.
     */
    function _resetBonuses() internal virtual;

    // _______________ Private functions _______________

    /**
     * @notice Update the price and time for the next update.
     * @dev It also triggers the macro factor update if not disabled.
     */
    function _updateBonuses(uint256 _price) private {
        updatedPrices.push(_price);
        _onPriceUpdate(_price);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
