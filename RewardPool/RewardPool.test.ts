/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";
import { expect } from "chai";

import { EPOCHS_YEAR, DAY, ERRORS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
import {
  calculateExpectedReward,
  commitEpoch,
  commitEpochs,
  createManagerAndVest,
  getDelegatorPositionReward,
  retrieveRPSData,
} from "../helper";

export function RunVestedDelegateClaimTests(): void {
  describe("Claim delegation rewards", async function () {
    it("should revert when not the vest manager owner", async function () {
      const { vestManager, delegatedValidator } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      await expect(
        vestManager.connect(this.signers.accounts[10]).claimVestedPositionReward(delegatedValidator.address, 0, 0)
      ).to.be.revertedWith(ERRORS.ownable);
    });

    it("should not claim when active position", async function () {
      const { systemValidatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // ensure is active position
      expect(await rewardPool.isActiveDelegatePosition(delegatedValidator.address, vestManager.address), "isActive").to
        .be.true;
      const balanceBefore = await delegatedValidator.getBalance();

      // reward to be accumulated
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      expect(
        await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address),
        "getRawDelegatorReward"
      ).to.be.gt(0);

      // claim & check balance
      await vestManager.claimVestedPositionReward(delegatedValidator.address, 0, 0);
      const balanceAfter = await delegatedValidator.getBalance();
      expect(balanceAfter).to.be.eq(balanceBefore);
    });

    it("should return when unused position", async function () {
      const { validatorSet, rewardPool, liquidToken, vestManager, vestManagerOwner, delegatedValidator } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      const delegatedAmount = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);
      // ensure is active position
      expect(await rewardPool.isActiveDelegatePosition(delegatedValidator.address, vestManager.address), "isActive").to
        .be.true;

      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, delegatedAmount);
      await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedAmount);

      // check reward
      expect(
        await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address),
        "getRawDelegatorReward"
      ).to.be.eq(0);
      expect(await validatorSet.withdrawable(vestManager.address), "withdrawable").to.eq(0);
    });

    it("should revert when wrong rps index is provided", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // finish the vesting period
      await time.increase(WEEK * 52);

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      await expect(
        vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, balanceChangeIndex),
        "claimVestedPositionReward"
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "INVALID_EPOCH");

      // commit epoch
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      await expect(
        vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, balanceChangeIndex),
        "claimVestedPositionReward2"
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "WRONG_RPS");
    });

    it("should properly claim reward when not fully matured", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, vestManagerOwner, delegatedValidator } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      // calculate base rewards
      const baseReward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
      const base = await rewardPool.base();
      const vestBonus = await rewardPool.getVestingBonus(1);
      const rsi = await rewardPool.rsi();
      const expectedReward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

      // calculate max reward
      const maxVestBonus = await rewardPool.getVestingBonus(52);
      const maxRSI = await rewardPool.MAX_RSI_BONUS();
      const maxReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, baseReward);

      // commit epoch, so more reward is added that must not be claimed now
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize,
        WEEK + 1
      );

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      await expect(
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, balanceChangeIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances(
        [hre.ethers.constants.AddressZero, vestManagerOwner.address, rewardPool.address],
        [maxReward.sub(expectedReward), expectedReward, maxReward.mul(-1)]
      );
    });

    it("should properly claim reward when position fully matured", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, vestManagerOwner, delegatedValidator } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      // calculate base rewards
      const baseReward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
      const base = await rewardPool.base();
      const vestBonus = await rewardPool.getVestingBonus(1);
      const rsi = await rewardPool.rsi();
      const expectedReward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

      // calculate max reward
      const maxVestBonus = await rewardPool.getVestingBonus(52);
      const maxRSI = await rewardPool.MAX_RSI_BONUS();
      const maxReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, baseReward);

      // more rewards to be distributed
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize,
        WEEK * 2 + 1
      );

      const additionalReward = (
        await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address)
      ).sub(baseReward);

      const expectedAdditionalReward = base.mul(additionalReward).div(10000).div(EPOCHS_YEAR);
      const maxAdditionalReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, additionalReward);

      // prepare params for call
      const { position, epochNum, balanceChangeIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      // ensure rewards are matured
      const areRewardsMatured = position.end.add(position.duration).lt(await time.latest());
      expect(areRewardsMatured, "areRewardsMatured").to.be.true;

      const expectedFinalReward = expectedReward.add(expectedAdditionalReward);
      const maxFinalReward = maxReward.add(maxAdditionalReward);

      await expect(
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, balanceChangeIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances(
        [hre.ethers.constants.AddressZero, vestManagerOwner.address, rewardPool.address],
        [maxFinalReward.sub(expectedFinalReward), expectedFinalReward, maxFinalReward.mul(-1)]
      );
    });
  });
}
