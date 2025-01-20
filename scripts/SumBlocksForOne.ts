// Run: npx hardhat run scripts/SumBlocksForOne.ts --network childTest
import { getTransactionsByBlock, decodeTransactionInput } from "./_helper";

// Input parameters for the script:
const BLOCK_NUMBER = process.env.SUM_BLOCKS_FOR_ONE_BLOCK_NUMBER;
const MAX_BLOCK_NUMBER = process.env.SUM_BLOCKS_FOR_ONE_MAX_BLOCK_NUMBER;
const VALIDATOR_ADDRESS = process.env.SUM_BLOCKS_FOR_ONE_VALIDATOR_ADDRESS;
const CONTRACT_NAME = process.env.SUM_BLOCKS_FOR_ONE_CONTRACT_NAME;
const CONTRACT_ADDRESS = process.env.SUM_BLOCKS_FOR_ONE_CONTRACT_ADDRESS;
const FUNCTION_NAME = process.env.SUM_BLOCKS_FOR_ONE_FUNCTION_NAME;

// Get the signed blocks for validator from each the block
async function getDataFromBlock(_blockNumber: number) {
  const block = await getTransactionsByBlock(_blockNumber);
  if (!CONTRACT_NAME || !CONTRACT_ADDRESS || !FUNCTION_NAME || !VALIDATOR_ADDRESS) {
    console.error("Environment variables are not set.");
    process.exitCode = 1;
    return;
  }
  const decodedData = await decodeTransactionInput(
    CONTRACT_NAME,
    CONTRACT_ADDRESS,
    block.transactions[1].hash,
    FUNCTION_NAME
  );
  if (decodedData === undefined || decodedData.uptime === undefined) {
    return 0;
  }
  const signedBlocks = getAddressValue(decodedData.uptime, VALIDATOR_ADDRESS);
  return signedBlocks;
}

// Helper function to get the number of signed blocks for a given address
function getAddressValue(data: any, address: any) {
  for (const element of data) {
    if (element[0] === address) {
      return element[1];
    }
  }
  return 0; // Add 0 if address didn't sign any blocks
}

// Get the sum of signed blocks for the validator
async function getSumBlocks() {
  console.log(
    ` 
_________________________________

Summing the signed blocks 
for ${VALIDATOR_ADDRESS} 
from ${BLOCK_NUMBER} to ${MAX_BLOCK_NUMBER} block
_________________________________`
  );
  let sum: number = 0;
  if (!BLOCK_NUMBER || !MAX_BLOCK_NUMBER) {
    console.error("Environment variables are not set.");
    process.exitCode = 1;
    return;
  }
  for (let i = Number(BLOCK_NUMBER); i < Number(MAX_BLOCK_NUMBER); i += 500) {
    const blocks = await getDataFromBlock(i);
    const blockToNum = parseInt(blocks);
    sum += blockToNum;
    console.log(`Signed blocks: ${blocks}`);
  }
  console.log(`Sum of signed blocks: ${sum}`);
}

// Run the script
getSumBlocks().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
