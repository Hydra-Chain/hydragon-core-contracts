// Run: npx hardhat run scripts/EventsInRange.ts --network childTest
import { ethers } from "hardhat";

// const day = 60 * 60 * 24;
// const hour = 60 * 60;

// eslint-disable-next-line no-unused-vars
const FRI_TIMESTAMP = 1713537000; // 17:30 19.04.2024
// eslint-disable-next-line no-unused-vars
const SAT_TIMESTAMP = 1713623400; // 17:30 20.04.2024

// Input parameters for the function:
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000105";
const EVENT_NAME = "ValidatorRewardDistributed";
const VALIDATOR_ADDRESS = "0x";
const YOUR_START_TIME_IN_UNIX_TIMESTAMP = FRI_TIMESTAMP - 1000;
const YOUR_END_TIME_IN_UNIX_TIMESTAMP = FRI_TIMESTAMP;

async function getEventsByIndexedAddress(
  contractAddress: string,
  eventName: string,
  indexedAddress: string,
  startTime: number,
  endTime: number
) {
  // Get provider based on network name
  const provider = ethers.provider;
  const encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"], [indexedAddress]);

  // Step 1: Create filter to get events by indexed address
  const filter = {
    address: contractAddress,
    topics: [ethers.utils.id(eventName), encodedAddress],
  };

  // Step 2: Get events in the specified time range
  const events = await provider.getLogs(
    Object.assign({}, filter, {
      fromBlock: startTime,
      toBlock: endTime,
    })
  );

  console.log(
    `Events for ${eventName} with indexed address ${indexedAddress} from ${new Date(startTime * 1000)} to ${new Date(
      endTime * 1000
    )}:`
  );
  console.log(events);
}

// Run the function
getEventsByIndexedAddress(
  CONTRACT_ADDRESS,
  EVENT_NAME,
  VALIDATOR_ADDRESS,
  YOUR_START_TIME_IN_UNIX_TIMESTAMP,
  YOUR_END_TIME_IN_UNIX_TIMESTAMP
).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
