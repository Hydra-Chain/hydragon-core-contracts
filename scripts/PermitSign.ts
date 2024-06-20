import { ethers } from "hardhat";

// Inputs
const TOKEN_NAME = process.env.PERMIT_TOKEN_NAME;
const TOKEN_VERSION = process.env.PERMIT_TOKEN_VERSION;
const CHAIN_ID = process.env.PERMIT_CHAIN_ID;
const TOKEN_ADDRESS = process.env.PERMIT_TOKEN_ADDRESS;
const OWNER = process.env.PERMIT_OWNER;
const SPENDER = process.env.PERMIT_SPENDER;
const VALUE = process.env.PERMIT_VALUE;
const NONCE = process.env.PERMIT_NONCE;
const DEADLINE = process.env.PERMIT_DEADLINE;

// function getPermitSignature
async function getPermitSignature() {
  if (!process.env.PERMIT_PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY");
  }
  const wallet = new ethers.Wallet(process.env.PERMIT_PRIVATE_KEY, ethers.providers.getDefaultProvider());
  const result = ethers.utils.splitSignature(
    await wallet._signTypedData(
      {
        name: TOKEN_NAME,
        version: TOKEN_VERSION,
        chainId: CHAIN_ID,
        verifyingContract: TOKEN_ADDRESS,
      },
      {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      {
        owner: OWNER,
        spender: SPENDER,
        value: VALUE,
        nonce: NONCE,
        deadline: DEADLINE,
      }
    )
  );
  console.log(result);
  return result;
}

// Run the script
getPermitSignature().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
