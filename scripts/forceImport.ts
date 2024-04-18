// scripts/upgrade-box.js
import { upgrades } from "hardhat";
// eslint-disable-next-line camelcase
import { ValidatorSet__factory } from "../typechain-types";

async function main() {
  const ValidatorSetFactory = new ValidatorSet__factory();

  const validatorSetImpl = await upgrades.forceImport(
    "0x0000000000000000000000000000000000000101",
    ValidatorSetFactory
  );
  console.log("ValidatorSet added.");
  console.log(validatorSetImpl.address);
}

main();
