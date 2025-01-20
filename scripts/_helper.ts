/* eslint-disable camelcase */
/* eslint-disable node/no-extraneous-import */

// helper functions for scripts
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { HydraChain__factory, HydraDelegation__factory } from "../typechain-types";

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
  if (await hasMatured(position.end, position.duration)) {
    alreadyMatureIn = position.end;
  } else {
    const currTime = Math.floor(Date.now() / 1000);
    const maturedPeriod = currTime - position.end.toNumber();
    alreadyMatureIn = position.start.toNumber() + maturedPeriod;
  }

  return alreadyMatureIn;
}

async function hasMatured(positionEnd: BigNumber, positionDuration: BigNumber) {
  const currTime = Math.floor(Date.now() / 1000);

  return positionEnd && positionDuration && positionEnd.add(positionDuration).lte(currTime);
}

interface RewardParams {
  timestamp: number;
}

export function findProperRPSIndex<T extends RewardParams>(arr: T[], timestamp: number): number {
  let left = 0;
  let right = arr.length - 1;
  let closestTimestamp: null | number = null;
  let closestIndex: null | number = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid].timestamp;

    if (midValue === timestamp) {
      // Timestamp found
      return mid;
    } else if (midValue < timestamp) {
      // Check if the timestamp is closer to the mid
      if (closestTimestamp === null || Math.abs(timestamp / midValue) < Math.abs(timestamp / closestTimestamp)) {
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
  blockTime: number
): number[] | null {
  if (!position || !position.duration || !position.end) return [0, 0];

  const currentTime = Date.now() / 1000;
  // 500 blocks per epoch, block on every ~ 0.6 seconds if cannot catch the block time
  const potentialEpochsInPosition = position.duration / ((50 * blockTime) / 100);

  let closestEpoch;
  if (position.end > currentTime || position.end === 0) {
    // position is still active or position doesn't exist
    closestEpoch = currentEpochId;
  } else if (position.end + position.duration > currentTime) {
    // reward is maturing
    // check for super early positions if block time changes
    if (currentEpochId <= potentialEpochsInPosition) {
      closestEpoch = 1;
    } else {
      closestEpoch = currentEpochId - potentialEpochsInPosition;
    }
  } else {
    // reward is fully matured
    closestEpoch = startEpoch + potentialEpochsInPosition;
  }

  const margin = 1000;

  if (closestEpoch <= margin) {
    return [startEpoch, margin * 2];
  }

  return [closestEpoch - margin, closestEpoch + margin];
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
  const rpsIndex = findProperRPSIndex(rpsValues, maturedIn);
  if (rpsIndex === null) {
    return { epochNumber: 0, balanceChangeIndex: 0 };
  }
  const epochNumber = initialEpochs + rpsIndex;
  const balanceChangeIndex = findProperBalanceChangeIndex(delegationPoolParamsHistory, epochNumber);

  return { epochNumber, balanceChangeIndex };
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

  const delegationPoolParamsHistory = await HydraDelegationContract.getDelegationPoolParamsHistory(
    validator,
    delegator
  );
  const initialDelegationPoolParam = delegationPoolParamsHistory[0];

  // if epochNum is 0, then invalid
  if (!initialDelegationPoolParam || initialDelegationPoolParam.epochNum.eq(ZERO_BN)) return;

  const currEpochId = (await HydraChainContract.currentEpochId()).toNumber();
  const positionStartEpoch = initialDelegationPoolParam.epochNum.toNumber();
  const rpsValueParams = calcProperEpochsRangeForRPSValues(currEpochId, position, positionStartEpoch, 600);
  if (!rpsValueParams) return;

  const rpsValues = await HydraDelegationContract.getRPSValues(validator, rpsValueParams[0], rpsValueParams[1]);
  const { epochNumber, balanceChangeIndex } = await retrievePositionRewardData(
    position,
    delegationPoolParamsHistory,
    rpsValueParams[0],
    rpsValues
  );

  const { epochNumber: epochNumberTotal, balanceChangeIndex: balanceChangeIndexTotal } =
    await retrievePositionRewardData(position, delegationPoolParamsHistory, rpsValueParams[0], rpsValues, true);

  const positionClaimableReward = await HydraDelegationContract.calculatePositionClaimableReward(
    validator,
    delegator,
    epochNumber,
    balanceChangeIndex
  );

  const positionTotalReward = await HydraDelegationContract.calculatePositionTotalReward(
    validator,
    delegator,
    epochNumberTotal,
    balanceChangeIndexTotal
  );

  return {
    position: position,
    epochNumber,
    balanceChangeIndex,
    claimableReward: positionClaimableReward,
    totalReward: positionTotalReward,
  };
}
