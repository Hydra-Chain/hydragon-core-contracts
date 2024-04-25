// Run: npx hardhat run scripts/SumBlockForOne.ts --network childTest
import { getTransactionsByBlock, decodeTransaction } from "./_helper";

// Input parameters for the script:
const BLOCK_NUMBER = 1301000;
const MAX_BLOCK_NUMBER = 1335500;
const VALIDATOR_ADDRESS = process.env.ADDRESS_FOR_SCRIPTS;
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000105";
const FUNCTION_NAME = "distributeRewardsFor";

// Get the signed blocks for validator from each the block
async function getDataFromBlock(_blockNumber: number) {
  const block = await getTransactionsByBlock(_blockNumber);
  const decodedData = await decodeTransaction(CONTRACT_ADDRESS, block.transactions[1].hash, FUNCTION_NAME);
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
  for (let i = BLOCK_NUMBER; i < MAX_BLOCK_NUMBER; i += 500) {
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
