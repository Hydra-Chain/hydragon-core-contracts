// Run: npx hardhat run scripts/SumBlocksForAll.ts --network childTest || npm run SumBlocksForAll:childTest
import { getTransactionsByBlock, decodeTransaction, getCurrentBlock } from "./_helper";

// Input parameters for the script:
const CHECKED_BLOCKS = 100000; // Number of blocks to check behind from the given block number
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000105"; // RewardPool contract address
const FUNCTION_NAME = "distributeRewardsFor";

// Get the last block that gave uptime
async function getLastBlockNumberReward() {
  const currentBlock = await getCurrentBlock();
  const currentBlockNumber = currentBlock.number;
  const roundedValue = Math.floor(currentBlockNumber / 500) * 500;
  return roundedValue;
}

// Get the signed blocks for validators from each block
async function getDataFromBlock(_blockNumber: number) {
  const block = await getTransactionsByBlock(_blockNumber);
  const decodedData = await decodeTransaction(CONTRACT_ADDRESS, block.transactions[1].hash, FUNCTION_NAME);
  if (decodedData === undefined || decodedData.uptime === undefined) {
    return 0;
  }
  return decodedData.uptime;
}

// Loop through the blocks and sum the signed blocks for each validator
async function sumValuesForAddresses(_blockNumber: number, _BlockBackToBeChecked: number) {
  const sums: { [address: string]: number } = {};
  const block = await getTransactionsByBlock(_blockNumber);
  console.log(`
  _____________________________________________________
  Getting the sum of values for the last ${_BlockBackToBeChecked} blocks 
  Starting from block ${_blockNumber}
  Date of block number:
  ${new Date(block.timestamp * 1000)}:
  _____________________________________________________
  `);

  for (let i = _blockNumber; i > _blockNumber - _BlockBackToBeChecked; i -= 500) {
    const blocks = await getDataFromBlock(i);
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
  // Can Hardcode value for specific block number (make sure it is rounded to 500)
  const latestBlockNumber = await getLastBlockNumberReward();
  sumValuesForAddresses(latestBlockNumber, CHECKED_BLOCKS).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
})();
