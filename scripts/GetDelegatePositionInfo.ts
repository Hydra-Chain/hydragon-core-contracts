import { BigNumber } from "ethers";
/* eslint-disable camelcase */
// Run: npx hardhat run scripts/GetDelegatePositionInfo.ts --network hydraTest
import { ethers } from "hardhat";
import { HydraDelegation__factory } from "../typechain-types";
import { fetchClaimableRewards, fetchPositionInfoWithRewardData, fetchTotalRewards } from "./_helper";

// Input parameters for the script:
const VALIDATOR = process.env.POSITION_VALIDATOR;
const DELEGATOR = process.env.POSITION_DELEGATOR;

async function getDelegatePositionInfo() {
  if (!VALIDATOR || !DELEGATOR) {
    console.error("Missing environment variable: VALIDATOR or MANAGER.");
    process.exitCode = 1;
    return;
  }

  const provider = ethers.provider;
  const HydraDelegationContract = HydraDelegation__factory.connect(
    "0x0000000000000000000000000000000000000107",
    provider
  );
  if (!HydraDelegationContract) return;

  let rewardData = BigNumber.from(0);
  rewardData = await fetchClaimableRewards(HydraDelegationContract, VALIDATOR, DELEGATOR, 14528, 0);

  // rewardData = await fetchTotalRewards(HydraDelegationContract, VALIDATOR, DELEGATOR, 166748, 1);

  console.log(`
    __________Position details__________

    Validator:
      ${VALIDATOR}
    Manager:
      ${DELEGATOR}
    Reward Data:
      ${rewardData}
    _________________________________
    `);

  // const positionInfo = await fetchPositionInfoWithRewardData(VALIDATOR, DELEGATOR);
  // if (!positionInfo) return;

  // console.log(`
  //   __________Position details__________

  //   Validator:
  //     ${VALIDATOR}
  //   Manager:
  //     ${DELEGATOR}
  //   Claimable Reward Data:
  //     ${positionInfo.claimableRewardEpoch}
  //     ${positionInfo.claimableRewardBalanceChangeIndex}
  //   Total Reward Data:
  //     ${positionInfo.totalRewardEpoch}
  //     ${positionInfo.totalRewardBalanceChangeIndex}
  //   Rewards:
  //     ${positionInfo.claimableReward}
  //     ${positionInfo.totalReward}
  //   _________________________________
  //   `);
  // console.log(positionInfo.position);
}

// Run the script
getDelegatePositionInfo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
