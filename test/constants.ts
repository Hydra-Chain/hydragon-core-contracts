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
export const WEEK = 60 * 60 * 24 * 7;
export const VESTING_DURATION_WEEKS = 10; // in weeks
export const EPOCHS_YEAR = 31500;
/* eslint-disable no-unused-vars */
export enum VALIDATOR_STATUS {
  None = 0,
  Whitelisted = 1,
  Registered = 2,
  Banned = 3,
}

/// @notice This bytecode is used to mock and return true with any input
export const alwaysTrueBytecode = "0x600160005260206000F3";
/// @notice This bytecode is used to mock and return false with any input
export const alwaysFalseBytecode = "0x60206000F3";
/// @notice This bytecode is used to mock and revert with any input
export const alwaysRevertBytecode = "0x60006000FD";
