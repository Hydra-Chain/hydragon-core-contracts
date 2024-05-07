// Run: npx hardhat run scripts/GetBlockData.ts --network childTest
import { getTransactionsByBlock } from "./_helper";

// Input parameters for the script:
const BLOCK_NUMBER = process.env.GET_BLOCK_DATA_BLOCK_NUMBER;

async function getBlockData() {
  if (!BLOCK_NUMBER) {
    console.error("The GET_BLOCK_DATA_BLOCK_NUMBER environment variable is not set.");
    process.exitCode = 1;
  }
  const block = await getTransactionsByBlock(Number(BLOCK_NUMBER));
  console.log(`
__________Block details__________

Date of the block: 
${new Date(block.timestamp * 1000)}
_________________________________
`);
  console.log(block);
}

// Run the script
getBlockData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
