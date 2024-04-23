// Run: npx hardhat run scripts/SumBlocksForAll.ts --network childTest
import { ethers } from "hardhat";

// Input parameters for the function:
const BlockBackToBeChecked = 100000; // Number of blocks to check behind fom blockNumber
const contractAddress = "0x0000000000000000000000000000000000000105";
const functionName = "distributeRewardsFor";

// Get the last block number that gave rewards
async function getLastBlockNumber() {
  const currentBlockNumber = await ethers.provider.getBlockNumber();
  const roundedValue = Math.floor(currentBlockNumber / 500) * 500;
  return roundedValue;
}

// Get the 2nd transaction in a block that should give the uptime
async function getTransactionsByBlock(_blockNumber: number) {
  const provider = ethers.provider;
  const block = await provider.getBlockWithTransactions(_blockNumber);
  return decodeTransaction(block.transactions[1].hash);
}

// Decode the transaction input data
async function decodeTransaction(transactionHashNow: any) {
  const transaction = await ethers.provider.getTransaction(transactionHashNow);
  if (!transaction) {
    console.log("Transaction not found.");
    return;
  }
  const Contract = await ethers.getContractFactory("RewardPool");
  const contractInstance = Contract.attach(contractAddress);
  const decodedData = contractInstance.interface.decodeFunctionData(functionName, transaction.data);
  return decodedData.uptime;
}

// Loop through the blocks and sum the signed blocks for each address
async function sumValuesForAddresses(_blockNumber: number, _BlockBackToBeChecked: number) {
  const sums: { [address: string]: number } = {};
  const block = await ethers.provider.getBlockWithTransactions(_blockNumber);
  console.log(`
  _____________________________________________________
  Getting the sum of values for the last ${_BlockBackToBeChecked} blocks 
  Starting from block ${_blockNumber}
  Date of block number:
  ${new Date(block.timestamp * 1000)}:
  _____________________________________________________
  `);
  for (let i = _blockNumber; i > _blockNumber - _BlockBackToBeChecked; i -= 500) {
    const blocks = await getTransactionsByBlock(i);
    blocks.forEach((item: any) => {
      const address = item[0];
      const value = parseInt(item[1]);

      if (sums[address]) {
        sums[address] += value;
      } else {
        sums[address] = value;
      }
    });
    console.log(`Looped: ${i}, block`);
  }

  console.log(sums);
  return sums;
}

// Run the script
(async () => {
  const latestBlockNumber = await getLastBlockNumber(); // Can Hardcode value for specific block number
  sumValuesForAddresses(latestBlockNumber, BlockBackToBeChecked).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
})();
