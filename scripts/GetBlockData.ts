// Run: npx hardhat run scripts/GetBlockData.ts --network childTest || npm run GetBlockData:childTest
import { getTransactionsByBlock } from "./_helper";

// Input parameters for the script:
const BLOCK_NUMBER = 1441500;

async function getBlockData(blockNumber: number) {
  const block = await getTransactionsByBlock(blockNumber);
  console.log(`
__________Block details__________

Date of the block: 
${new Date(block.timestamp * 1000)}
_________________________________
`);
  console.log(block);
}

// Run the script
getBlockData(BLOCK_NUMBER).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
