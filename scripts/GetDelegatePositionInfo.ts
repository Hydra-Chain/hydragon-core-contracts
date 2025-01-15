// Run: npx hardhat run scripts/GetDelegatePositionInfo.ts --network hydraTest
import { fetchPositionInfoWithRewardData } from "./_helper";

// Input parameters for the script:
const VALIDATOR = process.env.VALIDATOR;
const DELEGATOR = process.env.DELEGATOR;

async function getDelegatePositionInfo() {
  if (!VALIDATOR || !DELEGATOR) {
    console.error("Missing environment variable: VALIDATOR or MANAGER.");
    process.exitCode = 1;
    return;
  }

  const positionInfo = await fetchPositionInfoWithRewardData(VALIDATOR, DELEGATOR);
  if (!positionInfo) return;

  console.log(`
    __________Position details__________

    Validator:
      ${VALIDATOR}
    Manager:
      ${DELEGATOR}
    RewardData:
      ${positionInfo.epochNumber}
      ${positionInfo.balanceChangeIndex}
    Rewards:
      ${positionInfo.claimableReward}
      ${positionInfo.totalReward}
    _________________________________
    `);
  console.log(positionInfo.position);
}

// Run the script
getDelegatePositionInfo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
