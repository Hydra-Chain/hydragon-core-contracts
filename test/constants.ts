import { ethers } from "hardhat";

export const DOMAIN = ethers.utils.arrayify(ethers.utils.solidityKeccak256(["string"], ["DOMAIN_VALIDATOR_SET"]));
export const SYSTEM = "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE";
export const NATIVE_TOKEN_CONTRACT = "0x0000000000000000000000000000000000001010";
export const NATIVE_TRANSFER_PRECOMPILE = "0x0000000000000000000000000000000000002020";
export const VALIDATOR_PKCHECK_PRECOMPILE = "0x0000000000000000000000000000000000002030";
export const NATIVE_TRANSFER_PRECOMPILE_GAS = 21000;
export const VALIDATOR_PKCHECK_PRECOMPILE_GAS = 150000;
export const CHAIN_ID = 31337;
export const INITIAL_COMMISSION = ethers.BigNumber.from(10);
export const MAX_COMMISSION = ethers.BigNumber.from(100);
export const DAY = 60 * 60 * 24;
export const WEEK = DAY * 7;
export const VESTING_DURATION_WEEKS = 10; // in weeks
export const EPOCHS_YEAR = ethers.BigNumber.from(31500);
export const INITIAL_BASE_APR = ethers.BigNumber.from(500);
export const INITIAL_MACRO_FACTOR = ethers.BigNumber.from(7500);
export const MIN_RSI_BONUS = ethers.BigNumber.from(10000);
export const MAX_RSI_BONUS = ethers.BigNumber.from(17000);
export const DENOMINATOR = ethers.BigNumber.from(10000);
export const DEADLINE = ethers.constants.MaxUint256.toString();
/* eslint-disable no-unused-vars */
export enum VALIDATOR_STATUS {
  None = 0,
  Whitelisted = 1,
  Registered = 2,
  Active = 3,
  Banned = 4,
}

/// @notice This bytecode is used to mock and return true with any input
export const alwaysTrueBytecode = "0x600160005260206000F3";
/// @notice This bytecode is used to mock and return false with any input
export const alwaysFalseBytecode = "0x60206000F3";
/// @notice This bytecode is used to mock and revert with any input
export const alwaysRevertBytecode = "0x60006000FD";

export const ERRORS = {
  ownable: "Ownable: caller is not the owner",
  inactiveValidator: "INACTIVE_VALIDATOR",
  invalidValidator: "INVALID_VALIDATOR",
  swap: {
    newPositionUnavilable: "NEW_POSITION_UNAVAILABLE",
  },
  vesting: {
    invalidParamsIndex: "INVALID_PARAMS_INDEX",
  },
  accessControl: (account: string, role: string) => {
    return `AccessControl: account ${account} is missing role ${role}`;
  },
};
