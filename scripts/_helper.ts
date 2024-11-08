// helper functions for scripts
import { ethers } from "hardhat";

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
// ------------------------- Decode the input data of a transaction -------------------------
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
  // Step 2: Decode the input data using the contract's details
  const Contract = await ethers.getContractFactory(_contractName);
  const contractInstance = Contract.attach(_contractAddress);
  const decodedData = contractInstance.interface.decodeFunctionData(_functionName, transaction.data);
  return decodedData;
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
