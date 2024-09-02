/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import {
  calculatePenalty,
  calculatePenaltyByWeeks,
  commitEpochs,
  findProperRPSIndex,
  getValidatorReward,
  registerValidator,
} from "../helper";
import { HOUR, VESTING_DURATION_WEEKS, WEEK } from "../constants";

export function RunVestedStakingTests(): void {
  describe("", function () {
    const vestingDuration = VESTING_DURATION_WEEKS * WEEK;

    before(async function () {
      this.staker = this.signers.accounts[9];
    });

    describe("openVestedPosition()", function () {
      it("should open vested position", async function () {
        const { hydraChain, systemHydraChain, hydraStaking, aprCalculator } = await loadFixture(
          this.fixtures.stakedValidatorsStateFixture
        );

        await hydraChain.connect(this.signers.governance).addToWhitelist([this.staker.address]);
        await registerValidator(hydraChain, this.staker);
        const stakerHydraStaking = hydraStaking.connect(this.staker);
        const tx = await stakerHydraStaking.stakeWithVesting(VESTING_DURATION_WEEKS, {
          value: this.minStake,
        });

        const vestingData = await hydraStaking.vestedStakingPositions(this.staker.address);
        if (!tx) {
          throw new Error("block number is undefined");
        }

        expect(vestingData.duration, "duration").to.be.equal(vestingDuration);
        const start = await time.latest();
        expect(vestingData.start, "start").to.be.equal(start);
        expect(vestingData.end, "end").to.be.equal(start + vestingDuration);
        expect(vestingData.base, "base").to.be.equal(await aprCalculator.base());
        expect(vestingData.vestBonus, "vestBonus").to.be.equal(await aprCalculator.getVestingBonus(10));
        expect(vestingData.rsiBonus, "rsiBonus").to.be.equal(await aprCalculator.rsi());

        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // check is stake = min stake
        expect(await hydraStaking.stakeOf(this.staker.address), "stake").to.be.equal(this.minStake);
      });

      it("should not be in vesting cycle", async function () {
        const { stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        await expect(stakerHydraStaking.stakeWithVesting(vestingDuration))
          .to.be.revertedWithCustomError(stakerHydraStaking, "StakeRequirement")
          .withArgs("stakeWithVesting", "ALREADY_IN_VESTING_CYCLE");
      });
    });

    describe("decrease staking position with unstake()", function () {
      it("should revert when penalizeStaker function is not called by HydraChain", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(
          hydraStaking.connect(this.signers.accounts[1]).penalizeStaker(this.signers.accounts[1].address, [])
        )
          .to.be.revertedWithCustomError(hydraStaking, "Unauthorized")
          .withArgs("ONLY_HYDRA_CHAIN");
      });

      it("should get staker penalty and rewards must return 0 (burned), if closing from active position", async function () {
        const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
          this.fixtures.newVestingValidatorFixture
        );

        // commit some more epochs to generate additional rewards
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          5,
          this.epochSize
        );

        // get validator's reward amount
        const validatorReward = await getValidatorReward(stakerHydraStaking, this.staker.address);

        // reward must be bigger than 0
        expect(validatorReward, "validatorReward").to.be.gt(0);

        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());
        // get the penalty and reward from the contract
        const { penalty, reward } = await hydraStaking.calcVestedStakingPositionPenalty(
          this.staker.address,
          this.minStake
        );

        // calculate penalty locally
        const calculatedPenalty = await calculatePenalty(position, latestTimestamp, this.minStake);

        expect(penalty, "penalty").to.be.gt(0);
        expect(penalty, "penalty = calculatedPenalty").to.be.equal(calculatedPenalty);
        expect(reward, "reward").to.be.equal(0); // if active position, reward is burned
      });

      it("should decrease staking position and apply slashing penalty", async function () {
        const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
          this.fixtures.newVestingValidatorFixture
        );

        await stakerHydraStaking.stake({ value: this.minStake });

        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        const unstakeAmount = this.minStake.div(2);
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());
        const nextTimestamp = latestTimestamp.add(2);
        await time.setNextBlockTimestamp(nextTimestamp);

        const penalty = await calculatePenalty(position, nextTimestamp, unstakeAmount);
        await expect(stakerHydraStaking.unstake(unstakeAmount), "unstake").to.changeEtherBalance(
          hydraStaking,
          penalty.mul(-1)
        );

        const withdrawalAmount = await stakerHydraStaking.pendingWithdrawals(this.staker.address);
        expect(withdrawalAmount, "withdrawal amount = calculated amount").to.equal(unstakeAmount.sub(penalty));

        // increase time to be able to withdraw
        await time.increase(WEEK);

        await expect(stakerHydraStaking.withdraw(this.staker.address), "withdraw").to.changeEtherBalance(
          hydraStaking,
          unstakeAmount.sub(penalty).mul(-1)
        );
      });

      it("should slash when unstakes exactly 1 week after the start of the vesting position", async function () {
        const { hydraStaking, stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const nextTimestamp = position.start.add(WEEK);
        await time.setNextBlockTimestamp(nextTimestamp);
        await stakerHydraStaking.unstake(this.minStake);

        // hardcode the penalty percent by 1% a week (9 weeks should be left)
        const penalty = await calculatePenaltyByWeeks(VESTING_DURATION_WEEKS - 1, this.minStake);

        const withdrawalAmount = await stakerHydraStaking.pendingWithdrawals(this.staker.address);
        expect(withdrawalAmount, "withdrawal amount = calculated amount").to.equal(this.minStake.sub(penalty));

        // increase time to be able to withdraw
        await time.increase(WEEK);
        await expect(stakerHydraStaking.withdraw(this.staker.address), "withdraw").to.changeEtherBalance(
          hydraStaking,
          this.minStake.sub(penalty).mul(-1)
        );
      });

      it("should delete position data when full amount removed", async function () {
        const { hydraStaking, stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        await stakerHydraStaking.unstake(await hydraStaking.stakeOf(this.staker.address));

        const position = await hydraStaking.vestedStakingPositions(this.staker.address);

        expect(position.start, "start").to.be.equal(0);
        expect(position.end, "end").to.be.equal(0);
        expect(position.duration, "duration").to.be.equal(0);
      });

      it("should withdraw and validate there are no pending withdrawals", async function () {
        const { stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        await stakerHydraStaking.unstake(await stakerHydraStaking.stakeOf(this.staker.address));

        // increase time to be able to withdraw
        await time.increase(WEEK);
        await stakerHydraStaking.withdraw(this.staker.address);

        expect(await stakerHydraStaking.pendingWithdrawals(this.staker.address)).to.equal(0);
      });
    });

    describe("Claim position reward", function () {
      it("should not be able to claim when active", async function () {
        const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
          this.fixtures.newVestingValidatorFixture
        );

        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        await stakerHydraStaking.stake({ value: this.minStake });

        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        const reward = await getValidatorReward(hydraStaking, this.staker.address);
        expect(reward).to.be.gt(0);
      });

      it("should revert claimValidatorReward(epoch) when giving wrong index", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.vestingRewardsFixture);

        // add reward exactly before maturing (second to the last block)
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const penultimate = position.end.sub(1);
        await time.setNextBlockTimestamp(penultimate.toNumber());
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // enter maturing state
        const nextTimestampMaturing = position.end.add(position.duration.div(2));
        await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

        // calculate up to which epoch rewards are matured
        const valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
        const valRewardHistoryRecordIndex = findProperRPSIndex(
          valRewardsHistoryRecords,
          position.end.sub(position.duration.div(2))
        );

        // revert claim reward when adding 1 to the index
        await expect(hydraStaking.connect(this.staker)["claimStakingRewards(uint256)"](valRewardHistoryRecordIndex + 1))
          .to.be.reverted;
      });

      it("should be able to claim with claimValidatorReward(epoch) when maturing", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.vestingRewardsFixture);

        // add reward exactly before maturing (second to the last block)
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const penultimate = position.end.sub(1);
        await time.setNextBlockTimestamp(penultimate.toNumber());
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // enter maturing state
        const nextTimestampMaturing = position.end.add(position.duration.div(2));
        await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

        // calculate up to which epoch rewards are matured
        const valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
        const valRewardHistoryRecordIndex = findProperRPSIndex(
          valRewardsHistoryRecords,
          position.end.sub(position.duration.div(2))
        );

        // claim reward
        await expect(
          hydraStaking.connect(this.staker)["claimStakingRewards(uint256)"](valRewardHistoryRecordIndex)
        ).to.emit(hydraStaking, "StakingRewardsClaimed");
      });

      it("should be able to claim whole reward when not in position", async function () {
        const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
          this.fixtures.vestingRewardsFixture
        );

        // add reward exactly before maturing (second to the last block)
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const penultimate = position.end.sub(1);
        await time.setNextBlockTimestamp(penultimate.toNumber());
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // enter matured state
        const nextTimestampMaturing = position.end.add(position.duration);
        await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

        // get reward amount
        const reward = await getValidatorReward(hydraStaking, this.staker.address);

        // reward must be bigger than 0
        expect(reward).to.be.gt(0);

        // claim reward
        await expect(stakerHydraStaking["claimStakingRewards()"]())
          .to.emit(hydraStaking, "StakingRewardsClaimed")
          .withArgs(this.staker.address, reward);
      });
    });

    describe("calculateExpectedPositionReward()", async function () {
      it("should calculate the expected rewards when maturing", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.vestingRewardsFixture);

        // add reward exactly before maturing (second to the last block)
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const penultimate = position.end.sub(1);
        await time.setNextBlockTimestamp(penultimate.toNumber());
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // enter maturing state
        const nextTimestampMaturing = position.end.add(position.duration.div(2));
        await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

        // calculate up to which epoch rewards are matured
        const valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
        const valRewardHistoryRecordIndex = findProperRPSIndex(
          valRewardsHistoryRecords,
          position.end.sub(position.duration.div(2))
        );

        const stakerRewards = await hydraStaking.calculateExpectedPositionReward(
          this.staker.address,
          valRewardHistoryRecordIndex
        );

        const stakingRewardsHistory = await hydraStaking.stakingRewardsHistory(
          this.staker.address,
          valRewardHistoryRecordIndex
        );

        expect(stakerRewards).to.equal(stakingRewardsHistory.totalReward);
      });

      it("should calculate the expected maturing rewards after one claim", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.vestingRewardsFixture);

        // add reward exactly before maturing (second to the last block)
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        const penultimate = position.end.sub(1);
        await time.setNextBlockTimestamp(penultimate.toNumber());
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // enter maturing state
        const nextTimestampMaturing = position.end.add(position.duration.div(2));
        await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

        // calculate up to which epoch rewards are matured
        let valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
        let valRewardHistoryRecordIndex = findProperRPSIndex(
          valRewardsHistoryRecords,
          position.end.sub(position.duration.div(2))
        );

        const takenRewards = await hydraStaking.calculateExpectedPositionReward(
          this.staker.address,
          valRewardHistoryRecordIndex
        );

        await hydraStaking.connect(this.staker)["claimStakingRewards(uint256)"](valRewardHistoryRecordIndex);

        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          3, // number of epochs to commit
          this.epochSize,
          HOUR
        );

        // calculate again up to which epoch rewards are matured
        valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
        valRewardHistoryRecordIndex = findProperRPSIndex(
          valRewardsHistoryRecords,
          position.end.sub(position.duration.div(2))
        );

        const stakingRewardsHistory = await hydraStaking.stakingRewardsHistory(
          this.staker.address,
          valRewardHistoryRecordIndex
        );

        const stakerRewards = await hydraStaking.calculateExpectedPositionReward(
          this.staker.address,
          valRewardHistoryRecordIndex
        );

        expect(stakerRewards).to.equal(stakingRewardsHistory.totalReward.sub(takenRewards));
      });
    });
  });
}
