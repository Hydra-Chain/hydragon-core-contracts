// Run: npx hardhat run scripts/GetLastBlock.ts --network childTest || npm run GetLastBlock:childTest
import { getCurrentBlock } from "./_helper";

async function getCurrentTimestamp() {
  const block = await getCurrentBlock();
  const blockNumber = block.number;
  const currentTimestamp = block.timestamp;
  console.log(`
  _________________________________________

  Block Number: ${blockNumber}
  TimeStamp of the block: ${currentTimestamp}
  _________________________________________
  `);
}

// Run the script
getCurrentTimestamp().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});