// Run: npx hardhat run scripts/Decode.ts --network childTest || npm run Decode:childTest
import { decodeTransaction } from "./_helper";

// Input parameters for the script:
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000105";
const TRANSACTION_HASH = "0x4a2876153031b3c560c0c4333591aaeb4ccfe59cb742b17d50b3f0bfa684723a";
const FUNCTION_NAME = "distributeRewardsFor";

async function decodeTransactionInput() {
  const decodedData = await decodeTransaction(CONTRACT_ADDRESS, TRANSACTION_HASH, FUNCTION_NAME);
  console.log("___________Decoded Input Data___________");
  console.log(decodedData);
}

// Run the script
decodeTransactionInput().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
