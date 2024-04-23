// Run: npx hardhat run scripts/GetBlockAndTime.ts --network childTest
import { ethers } from "hardhat";

async function getCurrentTimestamp() {
  const provider = ethers.provider;

  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  const currentTimestamp = block.timestamp;

  console.log(`
  _________________________________________

  Block Number: ${blockNumber}
  TimeStamp of the block: ${currentTimestamp}
  _________________________________________
  `);
}

getCurrentTimestamp().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
