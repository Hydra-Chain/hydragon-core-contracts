// scripts/upgrade-box.js
import { ethers, upgrades } from "hardhat";
// eslint-disable-next-line camelcase
import { HydraDelegationV2__factory, HydraStakingV2__factory } from "../typechain-types";

async function main() {
  const signers = await ethers.getSigners();
  const HydraStakingFactory = new HydraStakingV2__factory(signers[0]);
  const hydraStakingImpl = await upgrades.upgradeProxy(
    "0x0000000000000000000000000000000000000104",
    HydraStakingFactory
  );

  console.log("HydraStaking upgraded:");
  console.log(hydraStakingImpl.address);

  const HydraDelegationFactory = new HydraDelegationV2__factory(signers[0]);
  const hydraDelegationImpl = await upgrades.upgradeProxy(
    "0x0000000000000000000000000000000000000107",
    HydraDelegationFactory
  );

  console.log("HydraDelegation upgraded:");
  console.log(hydraDelegationImpl.address);
}

main();
