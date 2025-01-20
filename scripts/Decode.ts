// Run: npx hardhat run scripts/Decode.ts --network childTest
import { decodeTransactionEvent, decodeTransactionInput } from "./_helper";

// Input parameters for the script:
const CONTRACT_NAME = process.env.DECODE_CONTRACT_NAME;
const CONTRACT_ADDRESS = process.env.DECODE_CONTRACT_ADDRESS;
const TRANSACTION_HASH = process.env.DECODE_TRANSACTION_HASH;
const FUNCTION_NAME = process.env.DECODE_FUNCTION_NAME;
const EVENT_CONTRACT_NAME = process.env.DECODE_EVENT_CONTRACT_NAME;
const EVENT_CONTRACT_ADDRESS = process.env.DECODE_EVENT_CONTRACT_ADDRESS;
const EVENT_NAME = process.env.DECODE_EVENT_NAME;

async function decodeTransaction() {
  if (!CONTRACT_NAME || !CONTRACT_ADDRESS || !TRANSACTION_HASH || !FUNCTION_NAME) {
    console.error("Environment variables are not set.");
    process.exitCode = 1;
    return;
  }
  const decodedData = await decodeTransactionInput(CONTRACT_NAME, CONTRACT_ADDRESS, TRANSACTION_HASH, FUNCTION_NAME);
  console.log("___________Decoded Input Data___________");
  console.log(decodedData);

  if (EVENT_CONTRACT_NAME && EVENT_CONTRACT_ADDRESS && EVENT_NAME) {
    const decodedEvent = await decodeTransactionEvent(
      EVENT_CONTRACT_NAME,
      EVENT_CONTRACT_ADDRESS,
      TRANSACTION_HASH,
      EVENT_NAME
    );
    console.log("___________Decoded Event Data___________");
    console.log(decodedEvent);
  }
}

// Run the script
decodeTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
