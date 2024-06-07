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
  findProperRPSIndex,
  getDelegatorPositionReward,
  getValidatorReward,
  retrieveRPSData,
} from "../helper";

export function RunStakeFunctionsByValidatorSet(): void {
  describe("External functions that should be called only by Validator Set", function () {
    it("should revert stake-protected functions if not called by ValidatorSet", async function () {
      const { systemValidatorSet, rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

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
          .onCutPosition(this.signers.delegator.address, this.signers.validators[3].address, 1, 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "Unauthorized")
        .withArgs("VALIDATORSET");

      await expect(
        rewardPool
          .connect(this.signers.accounts[3])
          .onSwapPosition(
            this.signers.validators[0].address,
            this.signers.validators[1].address,
            this.signers.delegator.address,
            1
          )
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
  describe("getDelegatorPositionReward()", async function () {
    it("should revert with invalid epoch", async function () {
      const { systemValidatorSet, validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // commit epochs to distribute some rewards and mature the position
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [delegatedValidator],
        3, // number of epochs to commit
        this.epochSize,
        WEEK
      );

      // prepare params for call
      const { balanceChangeIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      await expect(
        rewardPool.getDelegatorPositionReward(delegatedValidator.address, vestManager.address, 0, balanceChangeIndex)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "INVALID_EPOCH");
    });

    it("should revert with wrong rps", async function () {
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

      // commit epoch
      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize
      );

      await expect(
        rewardPool.getDelegatorPositionReward(
          delegatedValidator.address,
          vestManager.address,
          epochNum + 1,
          balanceChangeIndex
        )
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "WRONG_RPS");
    });

    it("should revert with invalid params index", async function () {
      const { systemValidatorSet, rewardPool, vestManager, oldValidator, newValidator } = await loadFixture(
        this.fixtures.swappedPositionFixture
      );

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 4, this.epochSize, WEEK);

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        newValidator.address,
        vestManager.address
      );

      await expect(
        rewardPool.getDelegatorPositionReward(
          newValidator.address,
          vestManager.address,
          epochNum,
          balanceChangeIndex + 1
        )
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", ERRORS.vesting.invalidParamsIndex);
    });

    it("should revert when get reward with late balance", async function () {
      const { systemValidatorSet, rewardPool, vestManager, oldValidator, newValidator } = await loadFixture(
        this.fixtures.swappedPositionFixture
      );

      const swapEpoch = await systemValidatorSet.currentEpochId();

      // commit few frequent epochs to generate some more rewards
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 5, this.epochSize);

      // commit 4 epochs, 1 week each in order to mature the position and be able to claim
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 4, this.epochSize, WEEK + 1);

      // prepare params for call
      const { balanceChangeIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        oldValidator.address,
        vestManager.address
      );

      await expect(
        rewardPool.getDelegatorPositionReward(
          oldValidator.address,
          vestManager.address,
          swapEpoch.sub(1),
          balanceChangeIndex
        )
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "LATE_BALANCE_CHANGE");
    });

    it("should revert when get reward with early balance", async function () {
      const { systemValidatorSet, rewardPool, vestManager, oldValidator, newValidator } = await loadFixture(
        this.fixtures.swappedPositionFixture
      );

      // commit few frequent epochs to generate some more rewards
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 5, this.epochSize);

      // commit 4 epochs, 1 week each in order to mature the position and be able to claim
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 4, this.epochSize, WEEK + 1);

      // prepare params for call
      const { epochNum } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        oldValidator.address,
        vestManager.address
      );

      await expect(rewardPool.getDelegatorPositionReward(oldValidator.address, vestManager.address, epochNum, 0))
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "EARLY_BALANCE_CHANGE");
    });

    it("should return 0 reward if the position is non-existing one", async function () {
      const { validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      const reward = await rewardPool.getDelegatorPositionReward(
        delegatedValidator.address,
        this.signers.accounts[5].address,
        epochNum,
        balanceChangeIndex
      );
      expect(reward).to.be.eq(0);
    });

    it("should return 0 reward if the position is still active", async function () {
      const { validatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        validatorSet,
        rewardPool,
        delegatedValidator.address,
        vestManager.address
      );

      const reward = await rewardPool.getDelegatorPositionReward(
        delegatedValidator.address,
        vestManager.address,
        epochNum,
        balanceChangeIndex
      );
      expect(reward).to.be.eq(0);
    });
  });

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
