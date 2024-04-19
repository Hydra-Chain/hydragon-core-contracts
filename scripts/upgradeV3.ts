// scripts/upgrade-box.js
import { ethers, upgrades } from "hardhat";
// eslint-disable-next-line camelcase
import { ValidatorSetV3__factory } from "../typechain-types";

async function main() {
  const signers = await ethers.getSigners();
  const ValidatorSetV3Factory = new ValidatorSetV3__factory(signers[0]);

  const validatorSetImpl = await upgrades.upgradeProxy(
    "0x0000000000000000000000000000000000000101",
    ValidatorSetV3Factory
  );
  console.log("ValidatorSet upgraded!");
  console.log(validatorSetImpl.address);
}

main();
