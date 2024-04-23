// Run: npx hardhat run scripts/InRangeTransactions.ts --network childTest
import { ethers } from "hardhat";

// eslint-disable-next-line no-unused-vars
const TIMESTAMP = 1713537000; // 17:30 19.04.2024

// Input parameters for the function:
const contractAddress = "0x0000000000000000000000000000000000000105";
const functionName = "distributeRewardsFor";
const startTime = TIMESTAMP;
const endTime = TIMESTAMP + 1000;

async function getTransactionsByFunctionAndTimestampRange(
  contractAddress: string,
  functionName: string,
  startTime: number,
  endTime: number
) {
  const provider = ethers.provider;

  // Get transaction receipts for the specified contract address
  const transactions = await provider.getLogs({
    address: contractAddress,
    topics: [ethers.utils.id(functionName)],
    fromBlock: startTime,
    toBlock: endTime,
  });

  console.log(
    ` 
      _________________________________

Transactions for function ${functionName} of contract ${contractAddress} 
from ${new Date(startTime * 1000)} to ${new Date(endTime * 1000)}
      _________________________________`
  );
  console.log(transactions);
}

getTransactionsByFunctionAndTimestampRange(contractAddress, functionName, startTime, endTime).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
