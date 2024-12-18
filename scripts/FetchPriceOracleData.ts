// Run: npx hardhat run scripts/FetchPriceOracleData.ts --network hydraTest
import { ContractFilter, getPriceUpdateEventsByFilters } from "./_helper";

// Input parameters for the script:
const YOUR_START_BLOCK = process.env.IN_RANGE_EVENTS_START_BLOCK;
const YOUR_END_BLOCK = process.env.IN_RANGE_EVENTS_END_BLOCK;
const PRICE_ORACLE_NAME = "PriceOracle";
const PRICE_ORACLE_ADDRESS = "0x0000000000000000000000000000000000000112";
const PRICE_ORACLE_EVENTS = ["PriceVoted"];
const APR_CALCULATOR_NAME = "APRCalculator";
const APR_CALCULATOR_ADDRESS = "0x0000000000000000000000000000000000000109";
const APR_CALCULATOR_EVENTS = ["PriceUpdated", "MacroFactorSet", "RSIBonusSet"];

async function getEvents(startBlock: number, endBlock: number) {
  const contractFilters: ContractFilter[] = [
    {
      contractName: PRICE_ORACLE_NAME,
      contractAddress: PRICE_ORACLE_ADDRESS,
      eventsToFilterFor: PRICE_ORACLE_EVENTS,
    },
    {
      contractName: APR_CALCULATOR_NAME,
      contractAddress: APR_CALCULATOR_ADDRESS,
      eventsToFilterFor: APR_CALCULATOR_EVENTS,
    },
  ];

  const { decodedEvents } = await getPriceUpdateEventsByFilters(contractFilters, startBlock, endBlock);
  printEventResult(startBlock, endBlock, decodedEvents);
}

function printEventResult(startBlock: number, endBlock: number, decodedEvents: any) {
  console.log(
    `
_________________________________

All decoded events related to the Price Vote and Price Updates
from ${startBlock} to ${endBlock} block
_________________________________`
  );

  console.log(decodedEvents);
}

// Run the script
if (YOUR_START_BLOCK && YOUR_END_BLOCK) {
  getEvents(Number(YOUR_START_BLOCK), Number(YOUR_END_BLOCK)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.error("Environment variables are not set.");
  process.exitCode = 1;
}
