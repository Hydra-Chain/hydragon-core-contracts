// Run: npx hardhat run scripts/GetPrices.ts --network hydraChain
import { decodeTransactionEvent, getEventsByFilters } from "./_helper";

const CONTRACT_NAME = "PriceOracle";
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000112";
const EVENT_NAME = "PriceUpdated";
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
    }
  }
}

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
      getPrices(i, i + 1000).catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    }
  }
} else {
  console.error("Environment variables are not set.");
  process.exitCode = 1;
}
