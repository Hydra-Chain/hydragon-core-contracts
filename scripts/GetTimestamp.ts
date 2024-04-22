// Run: npx hardhat run scripts/GetTimestamp.ts --network childTest
import { ethers } from "hardhat";

async function getCurrentTimestamp() {
  // Get provider based on network name
  const provider = ethers.provider;

  // Get current block number
  const blockNumber = await provider.getBlockNumber();

  // Get current block
  const block = await provider.getBlock(blockNumber);

  // Get current timestamp from the block
  const currentTimestamp = block.timestamp;

  console.log("Current Timestamp:", currentTimestamp);
}

// Run the function
getCurrentTimestamp().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
