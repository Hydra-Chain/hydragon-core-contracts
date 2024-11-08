// Run: npx hardhat run scripts/GetValData.ts --network childTest
import { ethers } from "hardhat";

async function getValData() {
  const HydraChain = await ethers.getContractFactory("HydraChain");

  const hydraChain = HydraChain.attach("0x0000000000000000000000000000000000000101");
  const validator = process.env.GET_VALIDATOR_DATA_ADDRESS;
  if (!validator) {
    throw new Error("Please provide a validator address");
  }
  const valData = await hydraChain.getValidator(validator);
  console.log(`
  _________________________________________

  Validator: ${validator}
  blsKey: ${valData.blsKey}
  stake: ${valData.stake}
  delegationOf: ${valData.totalStake.sub(valData.stake)}
  commission: ${valData.commission}
  withdrawableRewards: ${valData.withdrawableRewards}
  votingPower: ${valData.votingPower}
  ValidatorStatus: ${valData.status}
  isBanInitiated : ${valData.isBanInitiated}
  _________________________________________
  `);
}

// Run the script
getValData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
