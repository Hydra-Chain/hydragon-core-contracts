// scripts/upgrade-box.js
import { upgrades } from "hardhat";
// eslint-disable-next-line camelcase
import { HydraDelegationV2__factory, HydraStakingV2__factory } from "../typechain-types";

async function main() {
  const HydraStakingFactory = new HydraStakingV2__factory();
  await upgrades
    .validateUpgrade("0x0000000000000000000000000000000000000104", HydraStakingFactory)
    .then(() => {
      console.log("HydraStaking: No errors.");
    })
    .catch((err) => {
      console.error(err);
    });

  const HydraDelegationFactory = new HydraDelegationV2__factory();
  await upgrades
    .validateUpgrade("0x0000000000000000000000000000000000000107", HydraDelegationFactory)
    .then(() => {
      console.log("HydraDelegation: No errors.");
    })
    .catch((err) => {
      console.error(err);
    });

  console.log("Done.");
}

main();
