// Run: npx hardhat run scripts/FunctionSign.ts
import { ethers } from "hardhat";

async function main() {
  const functionName = "undelegate";
  const parameterTypes = ["address", "uint256"];
  const functionSignature = `${functionName}(${parameterTypes.join(",")})`;

  const functionSelector = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);

  console.log(`Function Signature: ${functionSignature}`);
  console.log(`Function Selector: ${functionSelector}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
