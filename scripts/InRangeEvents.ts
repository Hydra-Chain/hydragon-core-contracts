// Run: npx hardhat run scripts/InRangeEvents.ts --network childTest
import { ethers } from "hardhat";

// eslint-disable-next-line no-unused-vars
const EXAMPLE_BLOCK = 1300500; // 17:23 19.04.2024 1300500 block

// Input parameters for the function:
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000105";
const CONTRACT_NAME = "RewardPool";
const EVENT = "ValidatorRewardDistributed(address indexed validator, uint256 amount)";
const VALIDATOR_ADDRESS = "PUT ADDRESS HERE";
const YOUR_START_BLOCK = EXAMPLE_BLOCK - 1000;
const YOUR_END_BLOCK = EXAMPLE_BLOCK;

async function getEventsByIndexedAddress(
  contractAddress: string,
  contractName: string,
  event: string,
  indexedAddress: string,
  startBlock: number,
  endBlock: number
) {
  const provider = ethers.provider;
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contractInstance = ContractFactory.attach(contractAddress);

  // Use the contract's interface to encode the event signature
  const encodedEvent = contractInstance.interface.getEventTopic(event);
  // eslint-disable-next-line no-unused-vars
  const encodedAddress = ethers.utils.defaultAbiCoder.encode(["address"], [indexedAddress]);

  const filter = {
    address: contractAddress,
    topics: [encodedEvent, encodedAddress], // if you wanna filter all addresses, remove 'encodedAddress' and put null
    fromBlock: startBlock,
    toBlock: endBlock,
  };

  const events = await provider.getLogs(filter);

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
