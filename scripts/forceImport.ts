// scripts/upgrade-box.js
import { upgrades } from "hardhat";
// eslint-disable-next-line camelcase
import { HydraDelegation__factory, HydraStaking__factory } from "../typechain-types";

async function main() {
  const HydraStakingFactory = new HydraStaking__factory();
  await upgrades
    .forceImport("0x0000000000000000000000000000000000000104", HydraStakingFactory)
    .then((hydraStakingImpl) => {
      // Note: We never enter here because the admin is not a ProxyAdmin contract instance, so the call reverts
      // but it actually fetches the needed data
      console.log("HydraStaking added.");
      console.log(hydraStakingImpl.address);
    })
    .catch((error) => {
      console.log(error);
    });

  const HydraDelegationFactory = new HydraDelegation__factory();
  await upgrades
    .forceImport("0x0000000000000000000000000000000000000107", HydraDelegationFactory)
    .then((hydraDelegationImpl) => {
      // Note: We never enter here because the admin is not a ProxyAdmin contract instance, so the call reverts
      // but it actually fetches the needed data
      console.log("HydraDelegation added.");
      console.log(hydraDelegationImpl.address);
    })
    .catch((error) => {
      console.log(error);
    });

  console.log("Done.");
}

main();
