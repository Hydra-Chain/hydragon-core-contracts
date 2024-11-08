// Run: npx hardhat run scripts/Decode.ts --network childTest
import { decodeTransaction } from "./_helper";

// Input parameters for the script:
const CONTRACT_NAME = process.env.DECODE_CONTRACT_NAME;
const CONTRACT_ADDRESS = process.env.DECODE_CONTRACT_ADDRESS;
const TRANSACTION_HASH = process.env.DECODE_TRANSACTION_HASH;
const FUNCTION_NAME = process.env.DECODE_FUNCTION_NAME;

async function decodeTransactionInput() {
  if (!CONTRACT_NAME || !CONTRACT_ADDRESS || !TRANSACTION_HASH || !FUNCTION_NAME) {
    console.error("Environment variables are not set.");
    process.exitCode = 1;
    return;
  }
  const decodedData = await decodeTransaction(CONTRACT_NAME, CONTRACT_ADDRESS, TRANSACTION_HASH, FUNCTION_NAME);
  console.log("___________Decoded Input Data___________");
  console.log(decodedData);
}

// Run the script
decodeTransactionInput().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
