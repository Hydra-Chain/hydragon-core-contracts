// Run: npx hardhat run scripts/Decode.ts --network childTest
import { ethers } from "hardhat";

const contractAddress = "0x0000000000000000000000000000000000000105";
const transactionHash = "0xe50acba3e9b8acdf7383d07fcdd399d24a1aad1d37a8d1f6587995fb1b0d064e";
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
