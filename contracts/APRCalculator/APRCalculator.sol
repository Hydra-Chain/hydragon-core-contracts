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

        initializeVestingBonus();
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
    function initializeVestingBonus() private {
        vestingBonus[0] = 6;
        vestingBonus[1] = 16;
        vestingBonus[2] = 30;
        vestingBonus[3] = 46;
        vestingBonus[4] = 65;
        vestingBonus[5] = 85;
        vestingBonus[6] = 108;
        vestingBonus[7] = 131;
        vestingBonus[8] = 157;
        vestingBonus[9] = 184;
        vestingBonus[10] = 212;
        vestingBonus[11] = 241;
        vestingBonus[12] = 272;
        vestingBonus[13] = 304;
        vestingBonus[14] = 338;
        vestingBonus[15] = 372;
        vestingBonus[16] = 407;
        vestingBonus[17] = 444;
        vestingBonus[18] = 481;
        vestingBonus[19] = 520;
        vestingBonus[20] = 559;
        vestingBonus[21] = 599;
        vestingBonus[22] = 641;
        vestingBonus[23] = 683;
        vestingBonus[24] = 726;
        vestingBonus[25] = 770;
        vestingBonus[26] = 815;
        vestingBonus[27] = 861;
        vestingBonus[28] = 907;
        vestingBonus[29] = 955;
        vestingBonus[30] = 1003;
        vestingBonus[31] = 1052;
        vestingBonus[32] = 1101;
        vestingBonus[33] = 1152;
        vestingBonus[34] = 1203;
        vestingBonus[35] = 1255;
        vestingBonus[36] = 1307;
        vestingBonus[37] = 1361;
        vestingBonus[38] = 1415;
        vestingBonus[39] = 1470;
        vestingBonus[40] = 1525;
        vestingBonus[41] = 1581;
        vestingBonus[42] = 1638;
        vestingBonus[43] = 1696;
        vestingBonus[44] = 1754;
        vestingBonus[45] = 1812;
        vestingBonus[46] = 1872;
        vestingBonus[47] = 1932;
        vestingBonus[48] = 1993;
        vestingBonus[49] = 2054;
        vestingBonus[50] = 2116;
        vestingBonus[51] = 2178;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
