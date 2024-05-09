// Run: npx hardhat run scripts/InRangeEvents.ts --network childTest
import { getEventsByFilters } from "./_helper";

// Input parameters for the script:
const CONTRACT_ADDRESS = process.env.IN_RANGE_EVENTS_CONTRACT_ADDRESS;
const CONTRACT_NAME = process.env.IN_RANGE_EVENTS_CONTRACT_NAME;
const EVENT = process.env.IN_RANGE_EVENTS_EVENT;
const VALIDATOR_ADDRESS = process.env.IN_RANGE_EVENTS_VALIDATOR_ADDRESS;
const YOUR_START_BLOCK = process.env.IN_RANGE_EVENTS_START_BLOCK;
const YOUR_END_BLOCK = process.env.IN_RANGE_EVENTS_END_BLOCK;

async function getEventsByIndexedAddress(
  contractAddress: string,
  contractName: string,
  event: string,
  indexedAddress: string | null | undefined,
  startBlock: number,
  endBlock: number
) {
  const events = await getEventsByFilters(contractAddress, contractName, event, indexedAddress, startBlock, endBlock);
  console.log(
    ` 
_________________________________

Events for ${event} 
indexing ${indexedAddress} 
from ${startBlock} to ${endBlock} block
_________________________________`
  );
  console.log(events);
}

// Run the script
if (CONTRACT_ADDRESS && CONTRACT_NAME && EVENT && YOUR_START_BLOCK && YOUR_END_BLOCK) {
  getEventsByIndexedAddress(
    CONTRACT_ADDRESS,
    CONTRACT_NAME,
    EVENT,
    VALIDATOR_ADDRESS,
    Number(YOUR_START_BLOCK),
    Number(YOUR_END_BLOCK)
  ).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.error("Environment variables are not set.");
  process.exitCode = 1;
}
