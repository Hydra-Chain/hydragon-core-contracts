/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";
import { expect } from "chai";

import { DAY, EPOCHS_YEAR, ERRORS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
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

export function RunStakeFunctionsByValidatorSet(): void {
  describe("External functions that should be called only by Validator Set", function () {
    it("should revert stake-protected functions if not called by ValidatorSet", async function () {
      const { systemValidatorSet, rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      await expect(rewardPool.connect(this.signers.accounts[0]).onStake(systemValidatorSet.address, 1, 1))
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(rewardPool.connect(this.signers.system).onUnstake(systemValidatorSet.address, 1, 1))
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(rewardPool.connect(this.signers.governance).onNewStakePosition(systemValidatorSet.address, 1))
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");
    });
  });
}

export function RunDelegateFunctionsByValidatorSet(): void {
  describe("External functions that should be called only by Validator Set", function () {
    it("should revert delegate-protected functions if not called by ValidatorSet", async function () {
      const { systemValidatorSet, rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      await expect(rewardPool.connect(this.signers.accounts[1]).onNewValidator(systemValidatorSet.address))
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(
        rewardPool
          .connect(this.signers.delegator)
          .onDelegate(this.signers.delegator.address, this.signers.validators[0].address, 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(
        rewardPool
          .connect(this.signers.validators[1])
          .onUndelegate(this.signers.delegator.address, this.signers.validators[1].address, 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(
        rewardPool
          .connect(this.signers.accounts[2])
          .onNewDelegatePosition(this.signers.delegator.address, this.signers.validators[2].address, 1, 1, 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(
        rewardPool
          .connect(this.signers.accounts[3])
          .onTopUpDelegatePosition(this.signers.delegator.address, this.signers.validators[3].address, 1, 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(
        rewardPool
          .connect(this.signers.accounts[3])
          .onCutPosition(this.signers.delegator.address, this.signers.validators[3].address, 1, 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");
    });
  });
}

export function RunStakingClaimTests(): void {
  describe("Claim position reward", function () {
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

    it("should revert claimValidatorReward(epoch) when giving wrong index", async function () {
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

      // revert claim reward when adding 1 to the index
      await expect(rewardPool.connect(this.staker)["claimValidatorReward(uint256)"](valRewardHistoryRecordIndex + 1)).to
        .be.reverted;
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
        this.minDelegation
      );

      // commit epochs to distribute rewards
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], validator],
        5, // number of epochs to commit
        this.epochSize,
        DAY * 3 // three days per epoch, so, 3 x 5 = 15 days ahead
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

      // commit epoch so some more rewards are distributed
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], delegatedValidator],
        this.epochSize,
        WEEK + 1
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
        this.minDelegation
      );
      const manager2 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation
      );

      // Commit epochs so rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], validator],
        5, // number of epochs to commit
        this.epochSize,
        DAY * 3 // three days per epoch, so, 3 x 5 = 15 days ahead
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
        this.minDelegation
      );
      const manager2 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        52, // max weeks
        this.minDelegation
      );

      // Commit epochs so rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], validator],
        7, // number of epochs to commit
        this.epochSize,
        DAY * 3 // three days per epoch, so, 3 x 7 = 21 days ahead
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
        this.minDelegation.mul(2)
      );
      const manager2 = await createManagerAndVest(
        validatorSet,
        rewardPool,
        this.signers.accounts[4],
        validator.address,
        VESTING_DURATION_WEEKS,
        this.minDelegation
      );

      // commit epochs so rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], validator],
        5, // number of epochs to commit
        this.epochSize,
        WEEK // one week = 1 epoch
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
  });
}

export function RunVestedDelegationSwapTests(): void {
  describe("Delegate position rewards", async function () {
    it("should revert when not the vest manager owner", async function () {
      const { vestManager, delegatedValidator } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      await expect(
        vestManager
          .connect(this.signers.accounts[10])
          .swapVestedValidator(delegatedValidator.address, delegatedValidator.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert when the delegator has no active position for the old validator", async function () {
      const { vestManager, vestManagerOwner, rewardPool } = await loadFixture(this.fixtures.vestManagerFixture);

      await expect(
        vestManager
          .connect(vestManagerOwner)
          .swapVestedValidator(this.signers.validators[0].address, this.signers.validators[1].address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "OLD_POSITION_INACTIVE");
    });

    it("should revert that the position is inactive", async function () {
      const { systemValidatorSet, vestManager, delegatedValidator, rewardPool, vestManagerOwner } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize,
        // increase time to make the position maturing
        WEEK
      );

      // ensure is not active position
      expect(await rewardPool.isActiveDelegatePosition(delegatedValidator.address, vestManager.address), "isActive").be
        .false;

      await expect(
        vestManager
          .connect(vestManagerOwner)
          .swapVestedValidator(this.signers.validators[0].address, this.signers.validators[1].address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "OLD_POSITION_INACTIVE");
    });

    it("should revert when we try to swap to validator with maturing position", async function () {
      const { systemValidatorSet, vestManager, liquidToken, vestManagerOwner, rewardPool } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 2, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      // commit 8 epochs with 1 day increase before each, so, the first position gonna start maturing
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 8, this.epochSize, DAY);

      const newPosition = await rewardPool.delegationPositions(newValidator.address, vestManager.address);
      expect(newPosition.end.add(newPosition.duration).gt(await time.latest()), "Not matured").to.be.true;
      expect(newPosition.end.lt(await time.latest()), "isMaturing").to.be.true;

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "NEW_POSITION_MATURING");
    });

    it("should revert when we try to swap to active position (balance > 0)", async function () {
      const { vestManager, liquidToken, vestManagerOwner, rewardPool } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 1, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "INVALID_NEW_POSITION");
    });

    it("should transfer old position parameters to the new one on successful swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, liquidToken } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const validator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];

      const vestingDuration = 2; // 2 weeks
      await vestManager.connect(vestManagerOwner).openVestedDelegatePosition(validator.address, vestingDuration, {
        value: this.minDelegation.mul(2),
      });

      await commitEpoch(systemValidatorSet, rewardPool, [validator, newValidator], this.epochSize);

      const amount = await rewardPool.delegationOf(validator.address, vestManager.address);

      // give allowance & swap
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);
      await vestManager.connect(vestManagerOwner).swapVestedValidator(validator.address, newValidator.address);

      const oldPosition = await rewardPool.delegationPositions(validator.address, vestManager.address);
      const newPosition = await rewardPool.delegationPositions(newValidator.address, vestManager.address);

      // expect new position to be like the old position
      expect(oldPosition.duration, "oldPosition.duration").to.be.eq(newPosition.duration);
      expect(oldPosition.start, "oldPosition.start").to.be.eq(newPosition.start);
      expect(oldPosition.end, "oldPosition.end").to.be.eq(newPosition.end);
      expect(oldPosition.base, "oldPosition.base").to.be.eq(newPosition.base);
      expect(oldPosition.vestBonus, "oldPosition.vestBonus").to.be.eq(newPosition.vestBonus);
      expect(oldPosition.rsiBonus, "oldPosition.rsiBonus").to.be.eq(newPosition.rsiBonus);
    });

    it("should start earning rewards on new position after swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, oldValidator, newValidator } = await loadFixture(
        this.fixtures.swappedPositionFixture
      );

      await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize);

      const rewardsAfterSwap = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsAfterSwap, "rewardsAfterSwap").to.be.gt(0);
    });

    it("should stop earning rewards on old position after swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, oldValidator, newValidator, rewardsBeforeSwap } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize);

      const rewardsAfterSwap = await rewardPool.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsAfterSwap, "rewardsAfterSwap").to.be.eq(rewardsBeforeSwap).and.to.be.gt(0);
    });

    it("should revert when pass incorrect swap index", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, oldValidator, newValidator } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 4, this.epochSize, WEEK);

      const rewardsBeforeClaim = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsBeforeClaim).to.be.gt(0);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        newValidator.address,
        vestManager.address
      );

      await expect(
        vestManager.connect(vestManagerOwner).claimVestedPositionReward(newValidator.address, epochNum, topUpIndex + 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "INVALID_TOP_UP_INDEX");
    });

    it("should claim all rewards from the new position after swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, oldValidator, newValidator } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 4, this.epochSize, WEEK);

      const rewardsBeforeClaim = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsBeforeClaim).to.be.gt(0);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        newValidator.address,
        vestManager.address
      );

      await vestManager.connect(vestManagerOwner).claimVestedPositionReward(newValidator.address, epochNum, topUpIndex);

      const rewardsAfterClaim = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsAfterClaim).to.be.eq(0);
    });

    it("should claim all rewards from the old position after swap when the reward is matured", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, oldValidator, newValidator } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 3, this.epochSize, WEEK);

      const rewardsBeforeClaim = await rewardPool.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsBeforeClaim, "rewardsBeforeClaim").to.be.gt(0);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        oldValidator.address,
        vestManager.address
      );

      await vestManager.connect(vestManagerOwner).claimVestedPositionReward(oldValidator.address, epochNum, topUpIndex);

      const rewardsAfterClaim = await rewardPool.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsAfterClaim, "rewardsAfterClaim").to.be.eq(0);
    });

    it("should revert when try to swap again during the same epoch", async function () {
      const {
        rewardPool,
        vestManager,
        vestManagerOwner,
        newValidator: oldValidator,
        liquidToken,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      const newValidator = this.signers.validators[2];
      const amount = await rewardPool.delegationOf(oldValidator.address, vestManager.address);

      // give allowance
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);

      // try to swap
      await expect(
        vestManager.connect(vestManagerOwner).swapVestedValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("_onAccountParamsChange", "BALANCE_CHANGE_ALREADY_MADE");
    });

    it("should revert when try to swap too many times", async function () {
      const {
        systemValidatorSet,
        rewardPool,
        vestManager,
        vestManagerOwner,
        newValidator: oldValidator,
        liquidToken,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      const newValidator = this.signers.validators[2];

      await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize, 60 * 60);

      const amount = await rewardPool.delegationOf(oldValidator.address, vestManager.address);

      const balanceChangesThreshold = (await rewardPool.balanceChangeThreshold()).toNumber();
      for (let i = 0; i < balanceChangesThreshold; i++) {
        const _oldValidator = i % 2 === 0 ? oldValidator : newValidator;
        const _newValidator = i % 2 === 0 ? newValidator : oldValidator;

        // give allowance
        await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);
        await vestManager.connect(vestManagerOwner).swapVestedValidator(_oldValidator.address, _newValidator.address);
        await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize, 60 * 60);
      }

      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);

      // try to swap to exceed the number of the allowed balance changes
      await expect(
        vestManager.connect(vestManagerOwner).swapVestedValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("_onAccountParamsChange", "BALANCE_CHANGES_EXCEEDED");
    });
  });
}
