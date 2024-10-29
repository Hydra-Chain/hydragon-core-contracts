import { ethers } from "hardhat";

export const DOMAIN = ethers.utils.arrayify(ethers.utils.solidityKeccak256(["string"], ["DOMAIN_HYDRA_CHAIN"]));
export const SYSTEM = "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE";
export const NATIVE_TOKEN_CONTRACT = "0x0000000000000000000000000000000000001010";
export const NATIVE_TRANSFER_PRECOMPILE = "0x0000000000000000000000000000000000002020";
export const VALIDATOR_PKCHECK_PRECOMPILE = "0x0000000000000000000000000000000000002030";
export const NATIVE_TRANSFER_PRECOMPILE_GAS = 21000;
export const VALIDATOR_PKCHECK_PRECOMPILE_GAS = 150000;
export const CHAIN_ID = 31337;
export const INITIAL_COMMISSION = ethers.BigNumber.from(10);
export const MAX_COMMISSION = ethers.BigNumber.from(100);
export const HOUR = 60 * 60;
export const DAY = 60 * 60 * 24;
export const WEEK = DAY * 7;
export const VESTING_DURATION_WEEKS = 10; // in weeks
export const INITIAL_BASE_APR = ethers.BigNumber.from(500);
export const INITIAL_DEFAULT_MACRO_FACTOR = ethers.BigNumber.from(7500);
export const MIN_MACRO_FACTOR = ethers.BigNumber.from(1250);
export const MAX_MACRO_FACTOR = ethers.BigNumber.from(17500);
export const MIN_RSI_BONUS = ethers.BigNumber.from(10000);
export const MAX_RSI_BONUS = ethers.BigNumber.from(17000);
export const DENOMINATOR = ethers.BigNumber.from(10000);
export const DEADLINE = ethers.constants.MaxUint256.toString();
export const MAX_ACTIVE_VALIDATORS = 150;
export const INITIAL_PRICE = 500;
export const FAST_SMA = 115;
export const SLOW_SMA = 310;
export const ARRAY_310_ELEMENTS: number[] = Array(310).fill(INITIAL_PRICE);
export const BAN_THRESHOLD = 60 * 60 * 24; // 24 hours
/* eslint-disable no-unused-vars */
export enum VALIDATOR_STATUS {
  None = 0,
  Registered = 1,
  Active = 2,
  Banned = 3,
}

/// @notice This bytecode is used to mock and return true with any input
export const ALWAYS_TRUE_BYTECODE = "0x600160005260206000F3";
/// @notice This bytecode is used to mock and return false with any input
export const ALWAYS_FALSE_BYTECODE = "0x60206000F3";
/// @notice This bytecode is used to mock and revert with any input
export const ALWAYS_REVERT_BYTECODE = "0x60006000FD";

export const ERRORS = {
  initialized: "Initializable: contract is already initialized",
  ownable: "Ownable: caller is not the owner",
  unauthorized: {
    name: "Unauthorized",
    systemCallArg: "SYSTEMCALL",
    onlyHydraStakingArg: "ONLY_HYDRA_STAKING",
    onlyHydraDelegationArg: "ONLY_HYDRA_DELEGATION",
    inactiveStakerArg: "INACTIVE_STAKER",
    priceOracleArg: "ONLY_PRICE_ORACLE",
  },
  inactiveValidator: "INACTIVE_VALIDATOR",
  invalidValidator: "INVALID_VALIDATOR",
  mustBeRegistered: "MUST_BE_REGISTERED",
  swap: {
    newPositionUnavailable: "NEW_POSITION_UNAVAILABLE",
  },
  vesting: {
    invalidEpoch: "INVALID_EPOCH",
    wrongRPS: "WRONG_RPS",
  },
  DelegPoolLib: {
    invalidParamsIndex: "INVALID_PARAMS_INDEX",
    earlyBalanceChange: "EARLY_BALANCE_CHANGE",
    lateBalanceChange: "LATE_BALANCE_CHANGE",
    balanceChangeMade: "BALANCE_CHANGE_ALREADY_MADE",
  },
  accessControl: (account: string, role: string) => {
    return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
  },
};

export const INITIAL_DATA_PRICES = [169, 169, 168, 187, 167, 169, 151, 149, 149, 157, 162, 162, 176, 200, 188];

export const TABLE_DATA_PRICES = [
  0, 176, 168, 154, 149, 148, 148, 144, 142, 200, 215, 296, 284, 316, 391, 421, 416, 356, 323, 347, 384, 383, 437, 468,
  493, 512, 471, 487, 490, 492, 531, 688, 718, 841, 895, 796, 825, 735, 827, 831, 728, 762, 747, 717, 685, 741, 1096,
  1496, 1379, 1404, 1428, 1376, 1520, 1757, 1795, 1850, 1858, 1712, 1839, 1687, 1895, 1865, 1901, 2176, 2332, 2427,
  2426, 3514, 4777, 4054, 3349, 3035, 3341, 3802, 3798, 3246, 3260, 3005, 2976, 2777, 2684, 2158, 1906, 2091, 2203,
  2081, 2079, 2269, 2372, 2769, 3103, 3091, 3342, 3654, 3886, 3905, 4077, 3759, 3628, 3647, 3840, 3740, 3918, 4203,
  4421, 4593, 4722, 4274, 4439, 4386, 4707, 4405, 4472, 4425, 4229, 4021, 3098, 2627, 2125, 2891, 2785, 3218, 3395,
  3035, 2699, 2848, 2966, 3116, 3103, 3227, 2986, 3005, 3241, 3072, 3218, 3243, 3131, 3341, 3424, 3695, 4003, 4103,
  3837, 3507, 3697, 3342, 3371, 2981, 2593, 2646, 2626, 2559, 2574, 2695, 2740, 2841, 2885, 2609, 2628, 2617, 2533,
  2557, 2533, 2534, 2410, 2259, 2124, 2195, 2033, 1955, 1937, 1915, 1747, 1512, 1480, 1322, 1048, 1348, 1349, 1427,
  1537, 1699, 1746, 1663, 1713, 1732, 1674, 1534, 1622, 1614, 1582, 1580, 1471, 1478, 1713, 1684, 1627, 1647, 1715,
  1909, 1958, 1911, 1797, 1799, 1711, 1686, 1749, 1734, 1777, 1745, 1844, 1895, 1852, 1757, 1762, 1745, 1764, 1811,
  1845, 1842, 1908, 1938, 2287, 2384, 2382, 1982, 1976, 2091, 2104, 2168, 2159, 2105, 2148, 2213, 2158, 2220, 2241,
  2146, 1919, 1719, 1894, 1966, 1888, 1841, 1848, 1826, 1813, 1816, 1814, 1898, 1852, 1930, 2001, 1999, 1903, 1892,
  1885, 1998, 2036, 2100, 2072, 2079, 2076, 1965, 1987, 1938, 1948, 1949, 1969, 1923, 1878, 1885, 1864, 1842, 1812,
  1703, 1722, 1732, 1634, 1609, 1613, 1464, 1395, 1417, 1486, 1509, 1683, 1691, 1551, 1518, 1502, 1448, 1434, 1423,
  1390, 1377, 1419, 1326, 1363, 1415, 1433, 1404, 1416, 1392, 1336, 1280, 1296, 1305, 1324, 1278, 1213, 1151, 1096,
  1032, 1005, 906, 1091, 1002, 1004, 958, 966, 980, 981, 976, 988, 1015, 992, 1007, 954, 929, 905, 930, 935, 905, 910,
  865, 834, 885, 855, 802, 750, 731, 804, 785, 809, 769, 724,
];

export const TABLE_DATA_RSI = [
  0, 0, 0, 0, 0, 0, 0, 0, 11500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  11500, 11500, 12500, 0, 11500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11500,
  11500, 11500, 11500, 11500, 0, 0, 0, 0, 0, 0, 0, 11500, 11500, 11500, 11500, 11500, 11500, 12500, 11500, 12500, 12500,
  12500, 12500, 12500, 12500, 12500, 17000, 17000, 12500, 12500, 11500, 11500, 0, 0, 0, 0, 0, 0, 11500, 0, 0, 0, 0,
  11500, 11500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 11500, 11500, 11500, 11500, 12500, 12500, 12500, 12500, 17000, 12500, 11500, 11500, 0, 0, 0,
  11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 0, 11500, 0, 11500, 11500, 11500, 11500,
  11500, 11500, 11500, 11500, 12500, 12500, 12500, 12500, 17000, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500,
  11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 11500, 12500, 11500, 11500, 12500, 12500,
  12500, 11500, 11500, 11500, 11500, 11500,
];

export const TABLE_DATA_MACRO_FACTOR = [
  7500, 7500, 7500, 7500, 7500, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
  5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
  5000, 5000, 5000, 5000, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500,
];

export const INITIAL_PRICES_TO_REACH_BONUSES = [
  87788796, 88088430, 89487397, 84470755, 83453991, 81359600, 79444816, 77772912, 77838706, 76136634, 75471265,
  75755867, 76289059, 78167815, 80680751, 83068266, 85159342, 83139396, 81191796, 80143827, 79694684, 80346869,
  76547834, 77682709, 75779343, 76583844, 73945392, 70141402, 69398037, 68690347, 66176131, 63186492, 64311843,
  64046947, 62639833, 64055617, 64850695, 62337222, 61589665, 60885665, 62298819, 59185458, 58164025, 58883107,
  57811362, 59988833, 59175767, 58824952, 59913358, 60039783, 60069227, 60045121, 58242352, 58681399, 56984657,
  56991464, 56849578, 57249565, 61330641, 55898123, 55868283, 55277558, 55007801, 53419620, 53181350, 53401519,
  55179299, 53461364, 54088424, 56234334, 55398472, 54220950, 53671016, 53026600, 54669559, 56217964, 57420554,
  59082514, 57279016, 60403553, 62592446, 63183961, 66198332, 75191596, 70938091, 73711896, 72346596, 76635192,
  85131608, 85347610, 83602790, 80546855, 78136231, 75681593, 74575703, 69803998, 75027559, 71615338, 68436144,
  70274964, 72619473, 70484208, 76877948, 75357869, 80889105, 81473646, 78267586, 76711528, 75412995, 73730579,
  72269009, 70287765, 72415892, 78878560, 80264657, 76808481, 77648587, 79449637, 81258781, 76026704, 76853363,
  79893026, 76701921, 69382252, 72343172, 69841901, 70259247, 71630048, 70442534, 70519869, 72919461, 72013919,
  71852859, 71641066, 70432267, 69650618, 69000354, 69737541, 70381116, 68857706, 68218739, 64392655, 67601253,
  67086504, 67879290, 68730197, 68680026, 68106336, 64691765, 64000022, 61530347, 59534224, 57479477, 58961354,
  56257113, 58091278, 58618881, 56233448, 57647519, 56902867, 58271589, 61969984, 61730390, 60998443, 60558121,
  63005475, 62216076, 61674595, 60860886, 59917356, 60118369, 58614582, 57099773, 56457411, 58092840, 58476689,
  58427725, 57081647, 57352292, 56229339, 59260866, 56625406, 54090660, 54361643, 53587668, 52144663, 51459575,
  50868050, 50255545, 48439156, 47288280, 43932731, 40999948, 42793820, 43050070, 41297651, 42754831, 41309904,
  41756671, 41469504, 41077997, 41671534, 40704401, 40658611, 41091428, 39626034, 38007619, 38372194, 37755405,
  38402146, 38122765, 37931674, 38242969, 38400816, 39939748, 40569194, 44740370, 43899977, 43331003, 40160665,
  41237766, 40474331, 40541480, 38510098, 37699744, 38302400, 36813327, 39261787, 50808442, 51150198, 47969089,
  46026790, 43619586, 40960993, 41052148, 39350703, 38803073, 36171505, 36104167, 35851429, 36923123, 36162928,
  36176737, 35068957, 33546583, 33256850, 32508003, 31492732, 32060443, 31485081, 31629168, 32294166, 36033792,
  37302692, 34872441, 36036126, 36204282, 35687017, 34942457, 34559829, 33930777, 34503202, 33170581, 33357023,
  33292994, 33998358, 33221768, 32469516, 29555044, 29564881, 29660152, 29452157, 29868582, 28512138, 27500194,
  26569199, 25242721, 23866328, 23475984, 24089986, 24578880, 27052626, 26845819, 27175538, 26382257, 25598399,
  25434934, 26107154, 27623703, 26079091, 26875473, 27607148, 27111717, 26973437, 25330069, 24739477, 23457213,
  23732609, 23293966, 23234958, 22828615, 22707768, 21808949, 21392035, 21370805, 21239237, 20847768, 20923316,
  22663669, 22673055,
];
// 1st element Divided by 10 & 3rd Divided by 10 - so it fits the number 2^53, also 1st element is reward for 9 days, other are daily
export const TABLE_DATA_REWARDS_FOR_STAKER = [5225005051369863, 5151050513698630, 1504905051369863, 5497050513698630];
export const TABLE_DATA_REWARDS_FOR_DELEGATORS = [309203767123287, 903203767123287, 1904050513698630];
