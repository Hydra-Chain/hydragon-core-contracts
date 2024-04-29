// Run: npx hardhat run scripts/InRangeEvents.ts --network childTest || npm run InRangeEvents:childTest
import { getEventsByFilters } from "./_helper";

// Input parameters for the script:
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000105";
const CONTRACT_NAME = "RewardPool";
const EVENT = "ValidatorRewardDistributed(address indexed validator, uint256 amount)";
const VALIDATOR_ADDRESS = process.env.VALIDATOR_ADDRESS_FOR_SCRIPTS;
const YOUR_START_BLOCK = 1300500;
const YOUR_END_BLOCK = 1301500;

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
getEventsByIndexedAddress(
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  EVENT,
  VALIDATOR_ADDRESS,
  YOUR_START_BLOCK,
  YOUR_END_BLOCK
).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
