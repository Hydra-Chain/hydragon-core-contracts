// Run: npx hardhat run scripts/Decode.ts --network childTest
import { ethers } from "hardhat";

const contractAddress = "0x0000000000000000000000000000000000000105";
const transactionHash = "0x4a2876153031b3c560c0c4333591aaeb4ccfe59cb742b17d50b3f0bfa684723a";
const functionName = "distributeRewardsFor";

async function decodeTransaction() {
  // Step 1: Get the transaction details
  const transaction = await ethers.provider.getTransaction(transactionHash);
  if (!transaction) {
    console.log("Transaction not found.");
    return;
  }
  // Step 2: Decode the input data using the contract's details
  const Contract = await ethers.getContractFactory("RewardPool");
  const contractInstance = Contract.attach(contractAddress);
  const decodedData = contractInstance.interface.decodeFunctionData(functionName, transaction.data);

  console.log("Decoded Input Data:");
  console.log(decodedData);
}

decodeTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
