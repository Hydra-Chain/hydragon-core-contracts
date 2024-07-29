// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Governed} from "../common/Governed/Governed.sol";
import {Price} from "./modules/Price/Price.sol";
import {IAPRCalculator} from "./IAPRCalculator.sol";

contract APRCalculator is IAPRCalculator, Initializable, Price, Governed {
    uint256 public constant INITIAL_BASE_APR = 500;
    uint256 public constant INITIAL_MACRO_FACTOR = 7500;
    uint256 public constant MIN_MACRO_FACTOR = 1250;
    uint256 public constant MAX_MACRO_FACTOR = 17500;
    uint256 public constant MIN_RSI_BONUS = 10000;
    uint256 public constant MAX_RSI_BONUS = 17000;
    uint256 public constant DENOMINATOR = 10000;
    uint256 public constant EPOCHS_YEAR = 31500;
    bytes32 public constant MANAGER_ROLE = keccak256("manager_role");

    uint256 public rsi;
    uint256 public base;
    uint256 public macroFactor;
    uint256[52] public vestingBonus;

    // _______________ Initializer _______________

    function initialize(address manager, address hydraChainAddr, uint256 initalPrice) external initializer onlySystemCall {
        __Governed_init(manager);
        __Price_init(hydraChainAddr, initalPrice);
        base = INITIAL_BASE_APR;
        macroFactor = INITIAL_MACRO_FACTOR;

        initializeVestingBonus();

        _grantRole(MANAGER_ROLE, manager);
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IAPRCalculator
     */
    function setBase(uint256 newBase) external onlyRole(MANAGER_ROLE) {
        base = newBase;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function setMacro(uint256 newMacroFactor) external onlyRole(MANAGER_ROLE) {
        if (newMacroFactor < MIN_MACRO_FACTOR || newMacroFactor > MAX_MACRO_FACTOR) revert InvalidMacro();
        macroFactor = newMacroFactor;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function setRSI(uint256 newRSI) external onlyRole(MANAGER_ROLE) {
        if (newRSI > MAX_RSI_BONUS) revert InvalidRSI();

        if (newRSI < MIN_RSI_BONUS) newRSI = 0;

        rsi = newRSI;
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IAPRCalculator
     */
    function getBaseAPR() public view returns (uint256) {
        return base;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function getRSIBonus() public view returns (uint256) {
        return rsi;
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
    function getEpochsPerYear() public pure returns (uint256) {
        return EPOCHS_YEAR;
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

        nominator = (base + vestBonus) * macroFactor * MAX_RSI_BONUS;
        denominator = 10000 * 10000 * 10000;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function applyMaxReward(uint256 reward) public view returns (uint256) {
        // max vesting bonus is 52 weeks
        uint256 vestBonus = getVestingBonus(52);

        uint256 bonus = (base + vestBonus) * MAX_RSI_BONUS;

        return ((reward * bonus) / (10000 * 10000)) / EPOCHS_YEAR;
    }

    /**
     * @inheritdoc IAPRCalculator
     */
    function getEpochMaxReward(uint256 totalStaked) public view returns (uint256 reward) {
        uint256 nominator;
        uint256 denominator;

        (nominator, denominator) = getMaxAPR();

        // Divide to EPOCHS_YEAR because result is yearly
        return (totalStaked * nominator) / denominator / EPOCHS_YEAR;
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
    function applyBaseAPR(uint256 amount) public view returns (uint256) {
        return (amount * base) / DENOMINATOR / EPOCHS_YEAR;
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
