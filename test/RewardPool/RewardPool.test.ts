/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";
import { expect } from "chai";

import { EPOCHS_YEAR, MIN_RSI_BONUS, VESTING_DURATION_WEEKS, WEEK, ERRORS } from "../constants";
import {
  calculateExpectedReward,
  commitEpoch,
  commitEpochs,
  createManagerAndVest,
  findProperRPSIndex,
  getDelegatorPositionReward,
  getValidatorReward,
  retrieveRPSData,
} from "../helper";

export function RunStakingClaimTests(): void {
  describe("change minDelegate", function () {
    it("should revert if non-default_admin_role address try to change MinDelegation", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const adminRole = await rewardPool.DEFAULT_ADMIN_ROLE();

      await expect(
        rewardPool.connect(this.signers.validators[0]).changeMinDelegation(this.minDelegation.mul(2))
      ).to.be.revertedWith(ERRORS.accessControl(this.signers.validators[0].address.toLocaleLowerCase(), adminRole));

      expect(await rewardPool.minDelegation()).to.be.equal(this.minDelegation);
    });

    it("should revert if MinDelegation is too low", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const newLowMinDelegation = this.minStake.div(2);

      await expect(rewardPool.connect(this.signers.system).changeMinDelegation(newLowMinDelegation))
        .to.be.revertedWithCustomError(rewardPool, "InvalidMinDelegation")
        .withArgs(newLowMinDelegation);

      expect(await rewardPool.minDelegation()).to.be.equal(this.minDelegation);
    });

    it("should change MinDelegation by default_admin_role address", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const newMinDelegation = this.minDelegation.mul(2);

      await expect(rewardPool.connect(this.signers.system).changeMinDelegation(newMinDelegation)).to.not.be.reverted;

      expect(await rewardPool.minDelegation()).to.be.equal(newMinDelegation);
    });
  });
  describe("claim position reward", function () {
    it("should not be able to claim when active", async function () {
      const { stakerValidatorSet, systemValidatorSet, rewardPool } = await loadFixture(
        this.fixtures.newVestingValidatorFixture
      );

      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], this.staker],
        1, // number of epochs to commit
        this.epochSize
      );

      await stakerValidatorSet.stake({ value: this.minStake });

      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], this.staker],
        1, // number of epochs to commit
        this.epochSize
      );

      const reward = await getValidatorReward(stakerValidatorSet, this.staker.address);
      expect(reward).to.be.gt(0);
    });

    it("should be able to claim with claimValidatorReward(epoch) when maturing", async function () {
      const { systemValidatorSet, rewardPool } = await loadFixture(this.fixtures.vestingRewardsFixture);

      // add reward exactly before maturing (second to the last block)
      const position = await rewardPool.positions(this.staker.address);
      const penultimate = position.end.sub(1);
      await time.setNextBlockTimestamp(penultimate.toNumber());
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], this.staker],
        1, // number of epochs to commit
        this.epochSize
      );

      // enter maturing state
      const nextTimestampMaturing = position.end.add(position.duration.div(2));
      await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

      // calculate up to which epoch rewards are matured
      const valRewardsHistoryRecords = await rewardPool.getValRewardsHistoryValues(this.staker.address);
      const valRewardHistoryRecordIndex = findProperRPSIndex(
        valRewardsHistoryRecords,
        position.end.sub(position.duration.div(2))
      );

      // claim reward
      await expect(
        rewardPool.connect(this.staker)["claimValidatorReward(uint256)"](valRewardHistoryRecordIndex)
      ).to.emit(rewardPool, "ValidatorRewardClaimed");
    });

    it("should be able to claim whole reward when not in position", async function () {
      const { stakerValidatorSet, systemValidatorSet, rewardPool } = await loadFixture(
        this.fixtures.vestingRewardsFixture
      );

      // add reward exactly before maturing (second to the last block)
      const position = await rewardPool.positions(this.staker.address);
      const penultimate = position.end.sub(1);
      await time.setNextBlockTimestamp(penultimate.toNumber());
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], this.staker],
        1, // number of epochs to commit
        this.epochSize
      );

      // enter matured state
      const nextTimestampMaturing = position.end.add(position.duration);
      await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

      // get reward amount
      const reward = await getValidatorReward(stakerValidatorSet, this.staker.address);

      // reward must be bigger than 0
      expect(reward).to.be.gt(0);

      // claim reward
      await expect(rewardPool.connect(this.staker)["claimValidatorReward()"]())
        .to.emit(rewardPool, "ValidatorRewardClaimed")
        .withArgs(this.staker.address, reward);
    });
  });
}

export function RunDelegateClaimTests(): void {
  describe("Claim rewards", function () {
    it("should claim validator reward", async function () {
      const { systemValidatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], this.signers.validators[2]],
        this.epochSize
      );

      const reward = await rewardPool.getValidatorReward(this.signers.validators[0].address);
      const tx = await rewardPool.connect(this.signers.validators[0])["claimValidatorReward()"]();
      const receipt = await tx.wait();

      const event = receipt.events?.find((log: any) => log.event === "ValidatorRewardClaimed");
      expect(event?.args?.validator, "event.arg.validator").to.equal(this.signers.validators[0].address);
      expect(event?.args?.amount, "event.arg.amount").to.equal(reward);

      await expect(tx, "RewardsWithdrawn")
        .to.emit(rewardPool, "RewardsWithdrawn")
        .withArgs(this.signers.validators[0].address, reward);
    });

    it("should claim delegator reward", async function () {
      const { systemValidatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], this.signers.validators[2]],
        2, // number of epochs to commit
        this.epochSize
      );

      const reward = await rewardPool.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      const tx = await rewardPool
        .connect(this.signers.delegator)
        .claimDelegatorReward(this.signers.validators[0].address);
      const receipt = await tx.wait();
      const event = receipt.events?.find((log: any) => log.event === "DelegatorRewardClaimed");
      expect(event?.args?.validator, "event.arg.validator").to.equal(this.signers.validators[0].address);
      expect(event?.args?.delegator, "event.arg.delegator").to.equal(this.signers.delegator.address);
      expect(event?.args?.amount, "event.arg.amount").to.equal(reward);
    });
  });
}

export function RunVestedDelegationRewardsTests(): void {
  describe("Delegate position rewards", async function () {
    it("should get no rewards if the position is still active", async function () {
      const { systemValidatorSet, validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const validator = this.signers.validators[1];
      const manager = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation.mul(100)
      );

      // pass two weeks ahead
      await time.increase(WEEK * 2);

      // Commit epochs so rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], validator],
        10, // number of epochs to commit
        this.epochSize
      );

      const managerRewards = await getDelegatorPositionReward(
        validatorSet,
        rewardPool,
        validator.address,
        manager.address
      );

      expect(managerRewards).to.equal(0);
    });

    it("should generate partial rewards when enter maturing period", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // enter maturing period
      await time.increase(WEEK * 1 + 1);

      // Commit epoch so some more rewards are distributed
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], delegatedValidator],
        this.epochSize
      );

      const managerRewards = await getDelegatorPositionReward(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );
      const totalRewards = await rewardPool.calculateTotalPositionReward(
        delegatedValidator.address,
        vestManager.address
      );

      expect(managerRewards).to.be.lessThan(totalRewards);
    });

    it("should have the same rewards if the position size and period are the same", async function () {
      const { systemValidatorSet, validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const validator = this.signers.validators[2];
      const manager1 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation.mul(100)
      );
      const manager2 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation.mul(100)
      );

      // pass two weeks ahead
      await time.increase(WEEK * 2);

      // Commit epochs so rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], validator],
        10, // number of epochs to commit
        this.epochSize
      );

      const manager1rewards = await rewardPool.calculateTotalPositionReward(validator.address, manager1.address);
      const manager2rewards = await rewardPool.calculateTotalPositionReward(validator.address, manager2.address);

      expect(manager1rewards).to.equal(manager2rewards);
    });

    it("should have different rewards if the position period differs", async function () {
      const { systemValidatorSet, validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const validator = this.signers.validators[2];
      const manager1 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation.mul(100)
      );
      const manager2 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        52, // max weeks
        this.minDelegation.mul(100)
      );

      // pass three weeks ahead
      await time.increase(WEEK * 3);

      // Commit epochs so rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], validator],
        20, // number of epochs to commit
        this.epochSize
      );

      const manager1rewards = await rewardPool.calculateTotalPositionReward(validator.address, manager1.address);
      const manager2rewards = await rewardPool.calculateTotalPositionReward(validator.address, manager2.address);

      expect(manager2rewards).to.be.greaterThan(manager1rewards);
    });

    it("should have different rewards when the position differs", async function () {
      const { systemValidatorSet, validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const validator = this.signers.validators[2];
      const manager1 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation.mul(100)
      );
      const manager2 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation.mul(2)
      );

      // pass five weeks ahead
      await time.increase(WEEK * 5);

      // Commit epochs so rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], validator],
        20, // number of epochs to commit
        this.epochSize
      );

      const manager1rewards = await rewardPool.calculateTotalPositionReward(validator.address, manager1.address);
      const manager2rewards = await rewardPool.calculateTotalPositionReward(validator.address, manager2.address);

      expect(manager1rewards).to.be.greaterThan(manager2rewards);
    });
  });
}

export function RunVestedDelegateClaimTests(): void {
  describe("Claim delegation rewards", async function () {
    it("should revert when not the vest manager owner", async function () {
      const { vestManager, delegatedValidator } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      await expect(
        vestManager.connect(this.signers.accounts[10]).claimVestedPositionReward(delegatedValidator.address, 0, 0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
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
      const { epochNum, topUpIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      await expect(
        vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, topUpIndex),
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
        vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, topUpIndex),
        "claimVestedPositionReward2"
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "WRONG_RPS");
    });

    it("should properly claim reward when no top-ups and not full reward matured", async function () {
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

      // enter the maturing state
      await time.increase(WEEK * 1 + 1);

      // commit epoch, so more reward is added that must not be claimed now
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      await expect(
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances(
        [hre.ethers.constants.AddressZero, vestManagerOwner.address, rewardPool.address],
        [maxReward.sub(expectedReward), expectedReward, maxReward.mul(-1)]
      );
    });

    it("should properly claim reward when no top-ups and full reward matured", async function () {
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

      // ensure maturing has finished
      await time.increase(WEEK * 2 + 1);

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      const additionalReward = (
        await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address)
      ).sub(baseReward);

      const expectedAdditionalReward = base.mul(additionalReward).div(10000).div(EPOCHS_YEAR);
      const maxAdditionalReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, additionalReward);

      // prepare params for call
      const { position, epochNum, topUpIndex } = await retrieveRPSData(
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
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances(
        [hre.ethers.constants.AddressZero, vestManagerOwner.address, rewardPool.address],
        [maxFinalReward.sub(expectedFinalReward), expectedFinalReward, maxFinalReward.mul(-1)]
      );
    });

    it("should properly claim reward when top-ups and not full reward matured", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, vestManagerOwner, delegatedValidator } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      // calculate base rewards
      const baseReward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
      const base = await rewardPool.base();
      const vestBonus = await rewardPool.getVestingBonus(1);
      const rsi = await rewardPool.rsi();
      const expectedBaseReward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

      // top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, {
        value: this.minDelegation,
      });
      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      const topUpRewardsTimestamp = await time.latest();
      const position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);
      const toBeMatured = hre.ethers.BigNumber.from(topUpRewardsTimestamp).sub(position.start);

      // calculate top-up reward
      const topUpReward = (await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address)).sub(
        baseReward
      );

      // no rsi because top-up is used
      const expectedTopUpReward = await calculateExpectedReward(base, vestBonus, MIN_RSI_BONUS, topUpReward);
      const expectedReward = expectedBaseReward.add(expectedTopUpReward);

      // calculate max reward
      const maxVestBonus = await rewardPool.getVestingBonus(52);
      const maxRSI = await rewardPool.MAX_RSI_BONUS();
      const maxBaseReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, baseReward);
      const maxTopUpReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, topUpReward);
      const maxReward = maxBaseReward.add(maxTopUpReward);

      // enter the maturing state
      // two week is the duration + the needed time for the top-up to be matured
      await time.increase(2 * WEEK + toBeMatured.toNumber() + 1);

      // commit epoch, so more reward is added that must not be claimed now
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // prepare params for call
      let { epochNum, topUpIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      // 1 because we have only one top-up
      topUpIndex = 1;

      const areRewardsMatured = position.end.add(toBeMatured).lt(await time.latest());
      expect(areRewardsMatured, "areRewardsMatured").to.be.true;

      await expect(
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances(
        [hre.ethers.constants.AddressZero, vestManagerOwner.address, rewardPool.address],
        [maxReward.sub(expectedReward), expectedReward, maxReward.mul(-1)]
      );
    });

    it("should properly claim reward when top-ups and full reward matured", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, vestManagerOwner, delegatedValidator } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      // calculate base rewards
      const baseReward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
      const base = await rewardPool.base();
      const vestBonus = await rewardPool.getVestingBonus(1);
      const rsi = await rewardPool.rsi();
      const expectedBaseReward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

      // top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // calculate top-up reward
      const topUpReward = (await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address)).sub(
        baseReward
      );
      const expectedTopUpReward = await calculateExpectedReward(base, vestBonus, MIN_RSI_BONUS, topUpReward);

      const expectedReward = expectedBaseReward.add(expectedTopUpReward);

      // calculate max reward
      const maxRSI = await rewardPool.MAX_RSI_BONUS();
      const maxVestBonus = await rewardPool.getVestingBonus(52);
      const maxBaseReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, baseReward);
      const maxTopUpReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, topUpReward);

      const maxReward = maxBaseReward.add(maxTopUpReward);

      // enter the maturing state
      // 52 weeks is the duration + the needed time for the top-up to be matured
      await time.increase(WEEK * 104 * 4 + 1);

      // commit epoch, so more reward is added that must be without bonus
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      const additionalReward = (
        await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address)
      ).sub(baseReward.add(topUpReward));

      const expectedAdditionalReward = base.mul(additionalReward).div(10000).div(EPOCHS_YEAR);
      const maxAdditionalReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, additionalReward);

      // prepare params for call
      let { position, epochNum, topUpIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      // 1 because we have only one top-up, but the first is for the openDelegatorPosition
      topUpIndex = 1;

      // ensure rewards are matured
      const areRewardsMatured = position.end.add(position.duration).lt(await time.latest());
      expect(areRewardsMatured, "areRewardsMatured").to.be.true;

      const expectedFinalReward = expectedReward.add(expectedAdditionalReward);
      const maxFinalReward = maxReward.add(maxAdditionalReward);

      await expect(
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances(
        [hre.ethers.constants.AddressZero, vestManagerOwner.address, rewardPool.address],
        [maxFinalReward.sub(expectedFinalReward), expectedFinalReward, maxFinalReward.mul(-1)]
      );
    });

    it("should revert when invalid top-up index", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      const topUpRewardsTimestamp = await time.latest();
      const position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);
      const toBeMatured = hre.ethers.BigNumber.from(topUpRewardsTimestamp).sub(position.start);

      // enter the maturing state
      // two week is the duration + the needed time for the top-up to be matured
      await time.increase(WEEK * 104 + toBeMatured.toNumber() + 1);

      // comit epoch, so more reward is added that must not be claimed now
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // prepare params for call
      let { epochNum, topUpIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      // set invalid index
      topUpIndex = 2;

      // ensure rewards are maturing
      const areRewardsMatured = position.end.add(toBeMatured).lt(await time.latest());
      expect(areRewardsMatured).to.be.true;

      await expect(vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex))
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "INVALID_TOP_UP_INDEX");
    });

    it("should revert when later top-up index", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // add another top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // enter the maturing state
      // 52 weeks is the duration + the needed time for the top-up to be matured
      await time.increase(WEEK * 104 + 1);

      // commit epoch, so more reward is added that must not be claimed now
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // prepare params for call
      let { epochNum, topUpIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      // set later index
      topUpIndex = 2;

      await expect(vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum - 1, topUpIndex))
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "LATER_TOP_UP");
    });

    it("should revert when earlier top-up index", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // enter the maturing state
      // reward to be matured
      await time.increase(WEEK * 104);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      await expect(vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex))
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "EARLIER_TOP_UP");
    });

    it("should claim only reward made before top-up", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, vestManagerOwner, delegatedValidator } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      // calculate base rewards
      const baseReward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
      const base = await rewardPool.base();
      const vestBonus = await rewardPool.getVestingBonus(1);
      const rsi = await rewardPool.rsi();
      const expectedBaseReward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

      const maxRSI = await rewardPool.MAX_RSI_BONUS();
      const maxVestBonus = await rewardPool.getVestingBonus(52);
      const maxBaseReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, baseReward);

      const rewardDistributionTime = await time.latest();
      let position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);
      const toBeMatured = hre.ethers.BigNumber.from(rewardDistributionTime).sub(position.start);
      time.increase(50);

      // top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      // commit epoch, so more reward is added that must be without bonus
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);
      // enter the maturing state
      await time.increaseTo(position.end.toNumber() + toBeMatured.toNumber() + 1);

      // prepare params for call
      const currentEpochId = await validatorSet.currentEpochId();
      const rpsValues = await rewardPool.getRPSValues(delegatedValidator.address, 0, currentEpochId);
      const epochNum = findProperRPSIndex(rpsValues, position.start.add(toBeMatured));
      const topUpIndex = 0;

      // ensure rewards are maturing
      const areRewardsMaturing = position.end.add(toBeMatured).lt(await time.latest());
      expect(areRewardsMaturing).to.be.true;

      await expect(
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances(
        [hre.ethers.constants.AddressZero, vestManagerOwner.address, rewardPool.address],
        [maxBaseReward.sub(expectedBaseReward), expectedBaseReward, maxBaseReward.mul(-1)]
      );
    });

    it("should claim rewards multiple times", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, vestManagerOwner, delegatedValidator } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      // calculate rewards
      const baseReward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
      const base = await rewardPool.base();
      const vestBonus = await rewardPool.getVestingBonus(1);
      const rsi = await rewardPool.rsi();
      const reward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

      const maxRSI = await rewardPool.MAX_RSI_BONUS();
      const maxVestBonus = await rewardPool.getVestingBonus(52);
      const maxBaseReward = await calculateExpectedReward(base, maxVestBonus, maxRSI, baseReward);

      const rewardDistributionTime = await time.latest();
      let position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);
      const toBeMatured = hre.ethers.BigNumber.from(rewardDistributionTime).sub(position.start);
      time.increase(50);

      // top-up
      await vestManager.topUpVestedDelegatePosition(delegatedValidator.address, { value: this.minDelegation });

      // more rewards to be distributed but with the top-up data
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );
      // commit epoch, so more reward is added that must be without bonus
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);

      // enter the maturing state
      await time.increaseTo(position.end.toNumber() + toBeMatured.toNumber() + 1);

      // prepare params for call
      const currentEpochId = await validatorSet.currentEpochId();
      const rpsValues = await rewardPool.getRPSValues(delegatedValidator.address, 0, currentEpochId);
      const epochNum = findProperRPSIndex(rpsValues, position.start.add(toBeMatured));
      const topUpIndex = 0;

      // ensure rewards are maturing
      const areRewardsMaturing = position.end.add(toBeMatured).lt(await time.latest());
      expect(areRewardsMaturing).to.be.true;

      await expect(
        await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, topUpIndex),
        "claimVestedPositionReward"
      ).to.changeEtherBalances([vestManagerOwner.address, rewardPool.address], [reward, maxBaseReward.mul(-1)]);

      time.increase(WEEK * 2);

      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );
      expect(await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, topUpIndex + 1)).to
        .not.be.reverted;

      time.increase(WEEK * 52);
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      expect(await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, topUpIndex + 1)).to
        .not.be.reverted;
    });
  });
}
