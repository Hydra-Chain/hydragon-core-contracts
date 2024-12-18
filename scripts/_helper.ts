/* eslint-disable node/no-extraneous-import */
// helper functions for scripts
import { ethers } from "hardhat";
import { Contract } from "ethers";

// Get the provider
const provider = ethers.provider;

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

// ------------------------- Decode the input data and logs of a transaction -------------------------
export async function decodeTransaction(
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

  // console.log("=== tx receipt: ", await transaction.wait());
  const receipt = await transaction.wait();
  if (!receipt) {
    console.log("Transaction receipt not found.");
    return;
  }

  // Step 2: Decode the input data using the contract's details
  const Contract = await ethers.getContractFactory(_contractName);
  const contractInstance = Contract.attach(_contractAddress);
  const decodedData = contractInstance.interface.decodeFunctionData(_functionName, transaction.data);

  // Step 3: Decode the logs
  const decodedEvents = decodeLogs(contractInstance, receipt.logs);

  return { decodedData, decodedEvents };
}

export async function decodeLogs(_contractInstance: Contract, _logs: any) {
  // Decode the logs
  const decodedEvents = _logs
    .map((log: any) => {
      try {
        return decodeLog(_contractInstance, log);
      } catch (error) {
        // If the log is not from this contract, it will throw an error
        return null;
      }
    })
    .filter((event: any) => event !== null);

  return decodedEvents;
}

export function decodeLog(_contractInstance: Contract, _log: any) {
  // Decode the log
  return _contractInstance.interface.parseLog(_log);
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

  let encodedAddress = null;
  if (indexedAddress) {
    encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"], [indexedAddress]);
  }

  let currentBlockNum = 0;
  if (startBlock == null && endBlock == null) {
    const currentBlock = await getCurrentBlock();
    currentBlockNum = currentBlock.number;
  }

  const filter = {
    address: contractAddress,
    topics: [encodedEvent, encodedAddress],
    fromBlock: startBlock || currentBlockNum - 1000,
    toBlock: endBlock || currentBlockNum,
  };

  const events = await provider.getLogs(filter);
  return events;
}

export interface ContractFilter {
  contractName: string;
  contractAddress: string;
  eventsToFilterFor: string[];
}

export async function getPriceUpdateEventsByFilters(
  contractFilters: ContractFilter[],
  startBlock: number,
  endBlock: number,
  maxBlocksPerRequest: number = 5000
) {
  let allEvents: any = [];
  let allDecodedEvents: any = [];

  for (const filter of contractFilters) {
    const { contractName, contractAddress, eventsToFilterFor } = filter;
    const ContractFactory = await ethers.getContractFactory(contractName);
    const contractInstance = ContractFactory.attach(contractAddress);
    const blockIncrement = endBlock - startBlock < maxBlocksPerRequest ? 1 : maxBlocksPerRequest;

    for (const event of eventsToFilterFor) {
      const encodedEvent = contractInstance.interface.getEventTopic(event);

      for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += blockIncrement) {
        const toBlock = Math.min(fromBlock + maxBlocksPerRequest - 1, endBlock);

        const filter = {
          address: contractAddress,
          topics: [encodedEvent],
          fromBlock: fromBlock,
          toBlock: toBlock,
        };

        const partialEvents = await provider.getLogs(filter);
        if (partialEvents.length === 0) {
          continue;
        }

        allEvents = allEvents.concat(partialEvents);

        const partialDecodedEvents = await decodeLogs(contractInstance, partialEvents);
        allDecodedEvents = allDecodedEvents.concat(partialDecodedEvents);
      }
    }
  }

  return { events: allEvents, decodedEvents: allDecodedEvents };
}
