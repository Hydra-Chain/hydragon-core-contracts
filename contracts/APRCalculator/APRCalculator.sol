// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {MacroFactor} from "./modules/MacroFactor/MacroFactor.sol";
import {RSIndex} from "./modules/RSI/RSIndex.sol";
import {IAPRCalculator} from "./IAPRCalculator.sol";

contract APRCalculator is IAPRCalculator, MacroFactor, RSIndex {
    uint256 public constant BASE_APR = 500;

    uint256[52] public vestingBonus;

    // _______________ Initializer _______________

    function initialize(
        address governance,
        address hydraChainAddr,
        address priceOracleAddr,
        uint256[310] memory prices
    ) external initializer onlySystemCall {
        __Price_init(hydraChainAddr, priceOracleAddr, governance, prices);
        __MacroFactor_init_unchained();
        __RSIndex_init_unchained();

        _initializeVestingBonus();
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IAPRCalculator
     */
    function getBaseAPR() public pure returns (uint256) {
        return BASE_APR;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function getDENOMINATOR() public pure returns (uint256) {
        return DENOMINATOR;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function getVestingBonus(uint256 weeksCount) public view returns (uint256 nominator) {
        return vestingBonus[weeksCount - 1];
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function getMaxAPR() public view returns (uint256 nominator, uint256 denominator) {
        uint256 vestBonus = getVestingBonus(52);

        nominator = (BASE_APR + vestBonus) * MAX_MACRO_FACTOR * MAX_RSI_BONUS;
        denominator = 10000 ** 3;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function getMaxYearlyReward(uint256 totalStaked) public view returns (uint256 reward) {
        (uint256 nominator, uint256 denominator) = getMaxAPR();

        return (totalStaked * nominator) / denominator;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function applyMacro(uint256 totalStaked) public view returns (uint256 reward) {
        return (totalStaked * macroFactor) / DENOMINATOR;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function applyBaseAPR(uint256 amount) public pure returns (uint256) {
        return (amount * BASE_APR) / DENOMINATOR;
    }

    // _______________ Internal functions _______________

    function _onPriceUpdate(uint256 _price) internal override(MacroFactor, RSIndex) {
        MacroFactor._onPriceUpdate(_price);
        RSIndex._onPriceUpdate(_price);
    }

    function _resetBonuses() internal override(MacroFactor, RSIndex) {
        MacroFactor._resetBonuses();
        RSIndex._resetBonuses();
    }

    // _______________ Private functions _______________

    /**
     * @notice Initializes vesting bonus for each week.
     */
    function _initializeVestingBonus() private {
        vestingBonus = [
            6,
            16,
            30,
            46,
            65,
            85,
            108,
            131,
            157,
            184,
            212,
            241,
            272,
            304,
            338,
            372,
            407,
            444,
            481,
            520,
            559,
            599,
            641,
            683,
            726,
            770,
            815,
            861,
            907,
            955,
            1003,
            1052,
            1101,
            1152,
            1203,
            1255,
            1307,
            1361,
            1415,
            1470,
            1525,
            1581,
            1638,
            1696,
            1754,
            1812,
            1872,
            1932,
            1993,
            2054,
            2116,
            2178
        ];
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
