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
/* eslint-disable no-unused-vars */
export enum VALIDATOR_STATUS {
  None = 0,
  Registered = 1,
  Active = 2,
  Banned = 3,
}

/// @notice This bytecode is used to mock and return true with any input
export const alwaysTrueBytecode = "0x600160005260206000F3";
/// @notice This bytecode is used to mock and return false with any input
export const alwaysFalseBytecode = "0x60206000F3";
/// @notice This bytecode is used to mock and revert with any input
export const alwaysRevertBytecode = "0x60006000FD";

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
    invalidParamsIndex: "INVALID_PARAMS_INDEX",
    earlyBalanceChange: "EARLY_BALANCE_CHANGE",
  },
  accessControl: (account: string, role: string) => {
    return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
  },
};

export const initialDataPrices = [169, 169, 168, 187, 167, 169, 151, 149, 149, 157, 162, 162, 176, 200, 188];

export const tableDataPrices = [
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

export const tableDataRSI = [
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

export const tableDataMacroFactor = [
  7500, 7500, 7500, 7500, 7500, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
  5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
  5000, 5000, 5000, 5000, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500,
];
