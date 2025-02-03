// Run: npx hardhat run scripts/GetPrices.ts --network hydraChain
import { ethers } from "hardhat";
import { APRCalculator__factory } from "../typechain-types";
import { decodeTransactionEvent, getEventsByFilters } from "./_helper";

const CONTRACT_NAME = "PriceOracle";
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000112";
const CONTRACT_ADDRESS_APR = "0x0000000000000000000000000000000000000109";
const CONTRACT_NAME_APR = "APRCalculator";
const EVENT_NAME = "PriceUpdated";
const EVENT_NAME_MACRO = "MacroFactorSet";
const EVENT_NAME_RSI = "RSIBonusSet";
const START_BLOCK = process.env.IN_RANGE_EVENTS_START_BLOCK;
const END_BLOCK = process.env.IN_RANGE_EVENTS_END_BLOCK;

async function getPrices(startBlock: number, endBlock: number) {
  const events = await getEventsByFilters(CONTRACT_ADDRESS, CONTRACT_NAME, EVENT_NAME, null, startBlock, endBlock);
  if (events.length === 0) return;

  for (const event of events) {
    if (event.transactionHash) {
      const decodedEvent = await decodeTransactionEvent(
        CONTRACT_NAME,
        CONTRACT_ADDRESS,
        event.transactionHash,
        EVENT_NAME
      );
      if (!decodedEvent) continue;

      const args = decodedEvent[0].args;
      console.log(
        `
      _________________________________
      Decoded [price, day]: [${args.toString()}]
      tx: ${event.transactionHash}
      _________________________________`
      );

      const decodedEventMacro = await decodeTransactionEvent(
        CONTRACT_NAME_APR,
        CONTRACT_ADDRESS_APR,
        event.transactionHash,
        EVENT_NAME_MACRO
      );
      if (!decodedEventMacro) continue;
      const argsMacro = decodedEventMacro[0].args;
      console.log(`Decoded [macro]: [${argsMacro.toString()}]`);

      const decodedEventRSI = await decodeTransactionEvent(
        CONTRACT_NAME_APR,
        CONTRACT_ADDRESS_APR,
        event.transactionHash,
        EVENT_NAME_RSI
      );
      if (!decodedEventRSI) continue;
      const argsRSI = decodedEventRSI[0].args;
      console.log(`Decoded [rsi]: [${argsRSI.toString()}]`);

      const aprCalculator = new APRCalculator__factory((await ethers.getSigners())[0]).attach(CONTRACT_ADDRESS_APR);
      const averageGain = await aprCalculator.averageGain({
        blockTag: event.blockNumber + 1,
      });
      console.log("Average Gain: ", averageGain.toNumber() / 10000 / 100000000);

      const averageLoss = await aprCalculator.averageLoss({
        blockTag: event.blockNumber + 1,
      });
      console.log("Average Loss: ", averageLoss.toNumber() / 10000 / 100000000);

      // const smaFastSum = await aprCalculator.smaFastSum({
      //   blockTag: event.blockNumber + 1,
      // });
      // console.log("SMA Fast sum: ", smaFastSum.toString());

      // const smaSlowSum = await aprCalculator.smaSlowSum({
      //   blockTag: event.blockNumber + 1,
      // });
      // console.log("SMA Fast sum: ", smaSlowSum.toString());
    } else {
      throw new Error("No transaction hash found for event");
    }
  }
}

async function main() {
  // Run the script
  if (START_BLOCK && END_BLOCK) {
    const startBlock = Number(START_BLOCK);
    const endBlock = Number(END_BLOCK);
    const difference = endBlock - startBlock;
    if (difference <= 1000) {
      getPrices(startBlock, endBlock).catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    } else {
      for (let i = startBlock; i < endBlock; i += 1000) {
        await getPrices(i, i + 1000).catch((error) => {
          console.error(error);
          process.exitCode = 1;
        });
      }
    }
  } else {
    console.error("Environment variables are not set.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
