// scripts/upgrade-box.js
import { ethers, upgrades } from "hardhat";
// eslint-disable-next-line camelcase
import { ValidatorSetV2__factory } from "../typechain-types";

async function main() {
  const signers = await ethers.getSigners();
  const ValidatorSetV2Factory = new ValidatorSetV2__factory(signers[0]);

  const validatorSetImpl = await upgrades.upgradeProxy(
    "0x0000000000000000000000000000000000000101",
    ValidatorSetV2Factory
  );
  console.log("ValidatorSet upgraded:");
  console.log(validatorSetImpl.address);
}

main();
