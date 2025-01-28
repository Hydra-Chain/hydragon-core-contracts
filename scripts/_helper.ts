/* eslint-disable camelcase */
/* eslint-disable node/no-extraneous-import */

// helper functions for scripts
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { HydraChain__factory, HydraDelegation, HydraDelegation__factory } from "../typechain-types";

// Get the provider
const provider = ethers.provider;

export const ZERO_BN = BigNumber.from(0);

// ------------------------- Get current block -------------------------
export async function getCurrentBlock() {
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  return block;
}
// ------------------------- Get transactions from block -------------------------
export async function getTransactionsByBlock(blockNumber: number) {
  const block = await provider.getBlockWithTransactions(blockNumber);
  return block;
}
// ------------------------- Decode the input data of a transaction -------------------------
export async function decodeTransactionInput(
  _contractName: string,
  _contractAddress: string,
  _transactionHash: string,
  _functionName: string
) {
  // Step 1: Get the transaction details
  const transaction = await provider.getTransaction(_transactionHash);
  if (!transaction) {
    console.log("Transaction not found.");
    return;
  }

  // Step 2: Decode the input data using the contract's details
  const Contract = await ethers.getContractFactory(_contractName);
  const contractInstance = Contract.attach(_contractAddress);
  const decodedData = contractInstance.interface.decodeFunctionData(_functionName, transaction.data);
  return decodedData;
}

// ------------------------- Decode an event params from a transaction -------------------------
export async function decodeTransactionEvent(
  _contractName: string,
  _contractAddress: string,
  _transactionHash: string,
  _eventName: string
) {
  // Step 1: Get the transaction details
  const transaction = await provider.getTransaction(_transactionHash);
  if (!transaction) {
    console.log("Transaction not found.");
    return;
  }

  // Step 2: Get the transaction receipt which contains the events
  const receipt = await provider.getTransactionReceipt(_transactionHash);
  if (!receipt) {
    console.log("Transaction receipt not found.");
    return;
  }

  // Step 3: Get contract instance to decode events
  const Contract = await ethers.getContractFactory(_contractName);
  const contractInstance = Contract.attach(_contractAddress);

  // Step 4: Filter events from the specified contract
  const events = receipt.logs
    .filter((log) => log.address.toLowerCase() === _contractAddress.toLowerCase())
    .map((log) => {
      try {
        // Try to decode each event
        const decoded = contractInstance.interface.parseLog(log);
        return {
          name: decoded.name,
          args: decoded.args,
          signature: decoded.signature,
        };
      } catch (e) {
        // Skip events that can't be decoded with this contract's interface
        return null;
      }
    })
    .filter((event) => event !== null);

  // Step 5: Filter by the event name and return
  return events.filter((event) => event?.name === _eventName);
}

// ------------------------- Get events with filters -------------------------
export async function getEventsByFilters(
  contractAddress: string,
  contractName: string,
  event: string,
  indexedAddress: string | null | undefined,
  startBlock: number | null,
  endBlock: number | null
) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contractInstance = ContractFactory.attach(contractAddress);
  const encodedEvent = contractInstance.interface.getEventTopic(event);
  const topics = [encodedEvent];

  if (indexedAddress) {
    const encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"], [indexedAddress]);
    topics.push(encodedAddress);
  }

  let currentBlockNum = 0;
  if (startBlock == null && endBlock == null) {
    const currentBlock = await getCurrentBlock();
    currentBlockNum = currentBlock.number;
  }

  const filter = {
    address: contractAddress,
    topics,
    fromBlock: startBlock || currentBlockNum - 1000,
    toBlock: endBlock || currentBlockNum,
  };

  const events = await provider.getLogs(filter);
  return events;
}

// ------------------------- Get position details -------------------------
export async function getClosestMaturedTimestamp(position: any) {
  let alreadyMatureIn = 0;
  if (hasMatured(position.end, position.duration)) {
    alreadyMatureIn = position.end;
  } else {
    const currTime = Math.floor(Date.now() / 1000);
    const maturedPeriod = currTime - position.end.toNumber();
    alreadyMatureIn = position.start.toNumber() + maturedPeriod;
  }

  return BigNumber.from(alreadyMatureIn);
}

export function calculatePotentialEpochsForTime(time: number, blockTime: number) {
  // const bigNumberToNumber = time.toNumber();

  // 500 blocks per epoch, calculated with the block time
  return Math.floor(time / ((50 * blockTime) / 100));
}

function hasMatured(positionEnd: BigNumber, positionDuration: BigNumber) {
  const currTime = Math.floor(Date.now() / 1000);

  return positionEnd && positionDuration && positionEnd.add(positionDuration).lte(currTime);
}

interface RewardParams {
  timestamp: BigNumber;
}

// const abs = (n: BigNumber | number) => (BigNumber.isBigNumber(n) ? (n.isNegative() ? n.mul(-1) : n) : n < 0 ? -n : n);
// const abs = (n: bigint | number) => (n === -0 || n < 0n ? -n : n);
const abs = (n: BigNumber): BigNumber => (n.isNegative() ? n.mul(-1) : n);

export function findProperRPSIndex<T extends RewardParams>(arr: T[], timestamp: BigNumber): number {
  let left = 0;
  let right = arr.length - 1;
  let closestTimestamp: null | BigNumber = null;
  let closestIndex: null | number = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid].timestamp;
    // console.log("=== val: ", midValue);
    if (midValue.eq(ZERO_BN)) {
      console.log("=== is zero: ", midValue);

      continue;
    }

    if (midValue.eq(timestamp)) {
      // Timestamp found
      return mid;
    } else if (midValue.lt(timestamp)) {
      // Check if the timestamp is closer to the mid
      if (closestTimestamp === null || abs(timestamp.div(midValue)).lt(abs(timestamp.div(closestTimestamp)))) {
        closestTimestamp = midValue;
        closestIndex = mid;
      }
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (closestIndex === null) {
    throw new Error("Invalid timestamp");
  }

  return closestIndex;
}

export function findProperBalanceChangeIndex(arr: any[], epochNum: number): number {
  if (arr.length <= 1) return 0;

  let left = 0;
  let right = arr.length - 1;
  let closestEpoch: null | number = null;
  let closestIndex: null | number = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid].epochNum;
    if (midValue.eq(epochNum)) {
      // Timestamp found
      return mid;
    } else if (midValue.lt(epochNum)) {
      // Check if the timestamp is closer to the mid
      if (closestEpoch === null || Math.abs(epochNum / midValue) < Math.abs(epochNum / closestEpoch)) {
        closestEpoch = midValue;
        closestIndex = mid;
      }
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (closestIndex === null) {
    throw new Error("findLastPositionChangeIndex: Invalid epoch number");
  }

  return closestIndex;
}

export function calcProperEpochsRangeForRPSValues(
  currentEpochId: number,
  position: any,
  startEpoch: number,
  blockTime: number,
  isTotalReward: boolean = false
): [number, number] {
  // Validate position
  if (!position?.isVested || !position.start || !position.end || !position.duration) {
    return [0, 0];
  }

  // const margin = 1000;
  // const potentialEpochsInPosition = calculatePotentialEpochsForTime(position.duration, blockTime);
  // // Handle early positions
  // if (currentEpochId <= margin) {
  //   return [startEpoch, currentEpochId];
  // }

  // // Handle active positions
  // if (isActive(position.end)) {
  //   if (!isTotalReward) return [0, 0];

  //   // For non-swapped or new swapped positions, use current epoch
  //   if (!isSwapped(position) || isNewSwapped(position)) {
  //     return createEpochRange(currentEpochId, margin);
  //   }

  //   // For the old swapped positions, use swapped epoch
  //   const swappedAtEpoch = position.swappedBlock ? position.swappedBlock / 500n : currentEpochId;
  //   return createEpochRange(swappedAtEpoch, margin, startEpoch);
  // }

  const margin = 1000;
  const currentTime = Date.now() / 1000;
  // We fetch total rewards, position doesn't exist or is still active
  if (isTotalReward || position.end === 0 || position.end > currentTime) {
    return [currentEpochId > margin ? currentEpochId - margin : 0, currentEpochId + margin];
  }

  // Position has started maturing
  const positionMaturesIn = position.end + position.duration;
  if (positionMaturesIn > currentTime && position.end <= currentTime) {
    const maturedTime = Math.floor(currentTime - position.end);
    const maturedEpochs = calculatePotentialEpochsForTime(maturedTime, blockTime);
    const closestEpoch = startEpoch + maturedEpochs;

    return [closestEpoch - margin, currentEpochId];
  }

  // Position has matured
  const potentialEpochsInPosition = calculatePotentialEpochsForTime(position.duration, blockTime);
  const latestPotentialEpoch = startEpoch + potentialEpochsInPosition;
  return [latestPotentialEpoch - margin, latestPotentialEpoch + margin];
}

export async function retrievePositionRewardData(
  position: any,
  delegationPoolParamsHistory: any[],
  initialEpochs: number,
  rpsValues: any[],
  isTotalReward: boolean = false
) {
  if (!position || !delegationPoolParamsHistory || !rpsValues) {
    throw new Error("retrievePositionRewardData: Incorrect input data");
  }

  const maturedIn = isTotalReward ? position.end : await getClosestMaturedTimestamp(position);
  console.log("==== maturedIn: ", maturedIn);
  if (isTotalReward) {
    const newRPS = rpsValues.slice(100, 200);
    console.log("=== from 100 to 200 rps values: ", newRPS);
    console.log("=== proper index: ", findProperRPSIndex(newRPS, maturedIn));
  }
  const rpsIndex = findProperRPSIndex(rpsValues, maturedIn);
  if (rpsIndex === null) {
    return { epochNumber: 0, balanceChangeIndex: 0 };
  }

  if (isTotalReward) {
    console.log("=== rps index: ", rpsIndex);
    console.log("=== rps values for index: ", rpsValues[rpsIndex]);
    console.log("=== initial epochs: ", initialEpochs);
  }

  const epochNumber = initialEpochs + rpsIndex;
  const balanceChangeIndex = findProperBalanceChangeIndex(delegationPoolParamsHistory, epochNumber);

  return { epochNumber, balanceChangeIndex };
}

export async function fetchPositionRewards(
  hydraDelegationContract: HydraDelegation,
  currEpochId: number,
  validator: string,
  delegator: string,
  position: any,
  positionStartEpoch: number,
  delegationPoolParamsHistory: any
) {
  const rewardsInfo = {
    claimableRewardEpoch: 0,
    claimableRewardBalanceChangeIndex: 0,
    claimableReward: BigNumber.from(0),
    totalRewardEpoch: 0,
    totalRewardBalanceChangeIndex: 0,
    totalReward: BigNumber.from(0),
  };

  let rpsValueParams = calcProperEpochsRangeForRPSValues(currEpochId, position, positionStartEpoch, 400);
  if (!rpsValueParams) return rewardsInfo;
  console.log("=== claimable rps value params: ", rpsValueParams);

  let rpsValues = await hydraDelegationContract.getRPSValues(validator, rpsValueParams[0], rpsValueParams[1]);

  let { epochNumber, balanceChangeIndex } = await retrievePositionRewardData(
    position,
    delegationPoolParamsHistory,
    rpsValueParams[0],
    rpsValues
  );

  const positionClaimableReward = await fetchClaimableRewards(
    hydraDelegationContract,
    validator,
    delegator,
    epochNumber,
    balanceChangeIndex
  );

  rewardsInfo.claimableRewardEpoch = epochNumber;
  rewardsInfo.claimableRewardBalanceChangeIndex = balanceChangeIndex;
  rewardsInfo.claimableReward = positionClaimableReward;

  rpsValueParams = calcProperEpochsRangeForRPSValues(currEpochId, position, positionStartEpoch, 400, true);
  if (!rpsValueParams) return rewardsInfo;
  console.log("=== total rps value params: ", rpsValueParams);

  rpsValues = await hydraDelegationContract.getRPSValues(validator, rpsValueParams[0], rpsValueParams[1]);

  ({ epochNumber, balanceChangeIndex } = await retrievePositionRewardData(
    position,
    delegationPoolParamsHistory,
    rpsValueParams[0],
    rpsValues,
    true
  ));

  const positionTotalReward = await fetchTotalRewards(
    hydraDelegationContract,
    validator,
    delegator,
    epochNumber,
    balanceChangeIndex
  );

  rewardsInfo.totalRewardEpoch = epochNumber;
  rewardsInfo.totalRewardBalanceChangeIndex = balanceChangeIndex;
  rewardsInfo.totalReward = positionTotalReward;

  return rewardsInfo;
}

export async function fetchClaimableRewards(
  hydraDelegationContract: HydraDelegation,
  validator: string,
  delegator: string,
  epochNumber: number,
  balanceChangeIndex: number
) {
  console.log("==== claimable params: ", { epochNumber, balanceChangeIndex });
  return await hydraDelegationContract.calculatePositionClaimableReward(
    validator,
    delegator,
    epochNumber,
    balanceChangeIndex
  );
}

export async function fetchTotalRewards(
  hydraDelegationContract: HydraDelegation,
  validator: string,
  delegator: string,
  epochNumber: number,
  balanceChangeIndex: number
) {
  console.log("==== total reward params: ", { epochNumber, balanceChangeIndex });
  return await hydraDelegationContract.calculatePositionTotalReward(
    validator,
    delegator,
    epochNumber, // correct - 10384
    balanceChangeIndex
  );
}

export async function fetchPositionInfoWithRewardData(validator: string, delegator: string) {
  const HydraChainContract = HydraChain__factory.connect("0x0000000000000000000000000000000000000101", provider);

  const HydraDelegationContract = HydraDelegation__factory.connect(
    "0x0000000000000000000000000000000000000107",
    provider
  );
  if (!HydraChainContract || !HydraDelegationContract) return;

  const position = await HydraDelegationContract.vestedDelegationPositions(validator, delegator);
  if (!position || position.duration.lte(ZERO_BN)) return;
  console.log("=== position: ", position);

  const delegationPoolParamsHistory = await HydraDelegationContract.getDelegationPoolParamsHistory(
    validator,
    delegator
  );
  const initialDelegationPoolParam = delegationPoolParamsHistory[0];

  // if epochNum is 0, then invalid
  if (!initialDelegationPoolParam || initialDelegationPoolParam.epochNum.eq(ZERO_BN)) return;

  const currEpochId = (await HydraChainContract.currentEpochId()).toNumber();
  const positionStartEpoch = initialDelegationPoolParam.epochNum.toNumber();
  console.log("=== curr epoch: ", currEpochId);
  console.log("=== pos start epoch: ", positionStartEpoch);
  const rewardsInfo = await fetchPositionRewards(
    HydraDelegationContract,
    currEpochId,
    validator,
    delegator,
    position,
    positionStartEpoch,
    delegationPoolParamsHistory
  );

  return {
    position: position,
    claimableRewardEpoch: rewardsInfo.claimableRewardEpoch,
    claimableRewardBalanceChangeIndex: rewardsInfo.claimableRewardBalanceChangeIndex,
    claimableReward: rewardsInfo.claimableReward,
    totalRewardEpoch: rewardsInfo.totalRewardEpoch,
    totalRewardBalanceChangeIndex: rewardsInfo.totalRewardBalanceChangeIndex,
    totalReward: rewardsInfo.totalReward,
  };
}
