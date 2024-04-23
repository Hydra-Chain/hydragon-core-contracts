// Run: npx hardhat run scripts/GetBlockData.ts --network childTest
import { ethers } from "hardhat";

// Input parameters for the function:
const blockNumber = 1441500;

async function getTransactionsByBlock(blockNumber: number) {
  const provider = ethers.provider;
  const block = await provider.getBlockWithTransactions(blockNumber);

  console.log(`
__________Block details__________

Date of the block: 
${new Date(block.timestamp * 1000)}
 _________________________________
`);
  console.log(block);
}

getTransactionsByBlock(blockNumber).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
