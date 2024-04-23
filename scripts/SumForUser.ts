// Run: npx hardhat run scripts/SumForUser.ts --network childTest
import { ethers } from "hardhat";

// Input parameters for the function:
const blockNumber = 1301000;
const maxBlockNumber = 1335500;
const USER_ADDRESS = "0x00...";
const contractAddress = "0x0000000000000000000000000000000000000105";
const functionName = "distributeRewardsFor";

// Get the 2nd transaction in a block that should give give the uptime
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
  const signedBlocks = getAddressBigNumber(decodedData.uptime, USER_ADDRESS);
  return signedBlocks;
}

// Helper function to get the BigNumber object for a given address
function getAddressBigNumber(data: any, address: any) {
  for (const element of data) {
    if (element[0] === address) {
      return element[1];
    }
  }
  return 0; // Address not found
}

// Get the sum of signed blocks for user
async function getSumBlocks() {
  let sum: number = 0;
  for (let i = blockNumber; i < maxBlockNumber; i += 500) {
    const blocks = await getTransactionsByBlock(i);
    const blockToNum = parseInt(blocks);
    sum += blockToNum;
    console.log(`Blocks: ${blocks}`);
  }
  console.log(`Sum of blocks: ${sum}`);
}

// Run the script
getSumBlocks().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// eslint-disable-next-line no-unused-vars
const FRI_TIMESTAMP = 1713537000; // 17:30 19.04.2024
// eslint-disable-next-line no-unused-vars
const BFR_TIMESTAMP = 1713536588; // 17:23 19.04.2024 1300500 block
// eslint-disable-next-line no-unused-vars
const AFT_TIMESTAMP = 1713537763; // 17:42 19.04.2024 1301000 block
// eslint-disable-next-line no-unused-vars
const SAT_TIMESTAMP = 1713623400; // 17:30 20.04.2024
// eslint-disable-next-line no-unused-vars
const MAX_TIMESTAMP = 1713623616; // 17:33 20.04.2024 1335500 block
