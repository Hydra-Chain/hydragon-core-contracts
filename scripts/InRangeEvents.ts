// Run: npx hardhat run scripts/InRangeEvents.ts --network childTest
import { ethers } from "hardhat";

// eslint-disable-next-line no-unused-vars
const TIMESTAMP = 1713537000; // 17:30 19.04.2024

// Input parameters for the function:
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000105";
const EVENT_NAME = "ValidatorRewardDistributed";
const VALIDATOR_ADDRESS = "0x";
const YOUR_START_TIME_IN_UNIX_TIMESTAMP = TIMESTAMP - 1000;
const YOUR_END_TIME_IN_UNIX_TIMESTAMP = TIMESTAMP;

async function getEventsByIndexedAddress(
  contractAddress: string,
  eventName: string,
  indexedAddress: string,
  startTime: number,
  endTime: number
) {
  const provider = ethers.provider;
  const encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"], [indexedAddress]);

  const filter = {
    address: contractAddress,
    topics: [ethers.utils.id(eventName), encodedAddress],
  };

  const events = await provider.getLogs(
    Object.assign({}, filter, {
      fromBlock: startTime,
      toBlock: endTime,
    })
  );

  console.log(
    ` 
     _________________________________

Events for ${eventName} with indexed address ${indexedAddress} 
from ${new Date(startTime * 1000)} to ${new Date(endTime * 1000)}
     _________________________________`
  );
  console.log(events);
}

// Run the script
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
