/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import { expect } from "chai";
import { loadFixture, time, mine } from "@nomicfoundation/hardhat-network-helpers";

import {
  calcLiquidTokensToDistributeOnVesting,
  calculatePenalty,
  calculatePenaltyByWeeks,
  commitEpochs,
  findProperRPSIndex,
  getValidatorReward,
  registerValidator,
} from "../helper";
import { ERRORS, VESTING_DURATION_WEEKS, WEEK } from "../constants";

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
        await registerValidator(hydraChain, this.staker, 0);
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
        expect(vestingData.base, "base").to.be.equal(await aprCalculator.BASE_APR());
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

      it("should open vested position with the old stake base and adjust token balance", async function () {
        const { hydraStaking, systemHydraChain, liquidToken } = await loadFixture(
          this.fixtures.stakedValidatorsStateFixture
        );

        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          5, // number of epochs to commit
          this.epochSize
        );

        const validator = this.signers.validators[0];

        await hydraStaking.connect(validator).stake({ value: this.minStake.mul(20) });

        const tokenBalance = await liquidToken.balanceOf(validator.address);
        const rewardBeforeOpeningVestedPosition = await hydraStaking.unclaimedRewards(validator.address);
        expect(rewardBeforeOpeningVestedPosition).to.be.gt(0);

        // stake with vesting must distribute rewards from the previous stake
        await expect(
          hydraStaking.connect(validator).stakeWithVesting(52, { value: this.minStake })
        ).to.changeEtherBalance(validator.address, this.minStake.sub(rewardBeforeOpeningVestedPosition).mul(-1));

        const currentStake = await hydraStaking.stakeOf(validator.address);
        const expectedLiquidTokens = calcLiquidTokensToDistributeOnVesting(52, currentStake);
        const currentTokenBalance = await liquidToken.balanceOf(validator.address);
        expect(currentTokenBalance).to.be.equal(expectedLiquidTokens);
        expect(tokenBalance).to.be.above(currentTokenBalance);
      });

      it("should open vested position with the old vested matured position and adjust token balance", async function () {
        const { hydraStaking, liquidToken, systemHydraChain } = await loadFixture(
          this.fixtures.stakedValidatorsStateFixture
        );

        const validator = this.signers.validators[0];

        await hydraStaking.connect(validator).stakeWithVesting(1, { value: this.minStake.mul(20) });

        // commit epochs to mature the position
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize,
          WEEK * 3
        );

        const tokenBalance = await liquidToken.balanceOf(validator.address);
        expect(tokenBalance, "oldTokenBalance").to.be.lt(this.minStake.mul(22));
        expect(await hydraStaking.stakeOf(validator.address), "stake").to.be.eq(this.minStake.mul(22));

        await hydraStaking.connect(validator).stakeWithVesting(52, { value: this.minStake });

        const currentStake = await hydraStaking.stakeOf(validator.address);
        const expectedLiquidTokens = calcLiquidTokensToDistributeOnVesting(52, currentStake);
        const currentTokenBalance = await liquidToken.balanceOf(validator.address);
        expect(currentTokenBalance, "newTokenBalance").to.be.equal(expectedLiquidTokens);
        expect(tokenBalance, "old vs new balance").to.be.above(currentTokenBalance);
      });

      it("should revert open vested position with the old stake base if staker send his token balance to anyone", async function () {
        const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        const validator = this.signers.validators[0];

        await hydraStaking.connect(validator).stake({ value: this.minStake.mul(20) });
        await liquidToken.connect(validator).transfer(this.signers.delegator.address, 1);

        await expect(hydraStaking.connect(validator).stakeWithVesting(52, { value: this.minStake })).to.be.revertedWith(
          "ERC20: burn amount exceeds balance"
        );
      });

      it("should revert open vested position with the old vested position if staker send his token balance to anyone", async function () {
        const { hydraStaking, liquidToken, systemHydraChain } = await loadFixture(
          this.fixtures.stakedValidatorsStateFixture
        );

        const validator = this.signers.validators[0];

        await hydraStaking.connect(validator).stakeWithVesting(1, { value: this.minStake });
        await liquidToken.connect(validator).transfer(this.signers.delegator.address, 1);

        // commit epochs to mature the position
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize,
          WEEK * 3
        );

        await expect(hydraStaking.connect(validator).stakeWithVesting(52, { value: this.minStake })).to.be.revertedWith(
          "ERC20: burn amount exceeds balance"
        );
      });

      it("should not be in vesting cycle", async function () {
        const { stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        await expect(stakerHydraStaking.stakeWithVesting(vestingDuration))
          .to.be.revertedWithCustomError(stakerHydraStaking, "StakeRequirement")
          .withArgs("stakeWithVesting", "ALREADY_IN_VESTING_CYCLE");
      });

      it("should add debt to staker when opening a vested position", async function () {
        const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        const amount = await hydraStaking.stakeOf(this.staker.address);
        const liquidTokens = calcLiquidTokensToDistributeOnVesting(VESTING_DURATION_WEEKS, amount);

        expect(await liquidToken.balanceOf(this.staker.address)).to.be.equal(liquidTokens);
        expect(await hydraStaking.liquidityDebts(this.staker.address)).to.be.equal(amount.sub(liquidTokens).mul(-1));
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

      it("should lower the debt on unstake", async function () {
        const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

        await hydraStaking
          .connect(this.signers.validators[0])
          .stakeWithVesting(VESTING_DURATION_WEEKS, { value: this.minStake.mul(2) });

        const liquidTokens = calcLiquidTokensToDistributeOnVesting(VESTING_DURATION_WEEKS, this.minStake.mul(2));
        const liquidDebt = await hydraStaking.liquidityDebts(this.signers.validators[0].address);

        expect(liquidDebt).to.be.equal(this.minStake.mul(2).sub(liquidTokens).mul(-1));

        const ownedTokens = await hydraStaking.calculateOwedLiquidTokens(
          this.signers.validators[0].address,
          this.minStake.div(2)
        );

        const balanceBefore = await liquidToken.balanceOf(this.signers.validators[0].address);

        await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake.div(2));

        expect(await hydraStaking.liquidityDebts(this.signers.validators[0].address)).to.be.equal(0);
        expect(await liquidToken.balanceOf(this.signers.validators[0].address)).to.be.equal(
          balanceBefore.sub(ownedTokens)
        );
      });

      it("Should manage debt and collect tokens properly for vested staking positions", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        const validator = this.signers.validators[0];
        const stakedAmount = await hydraStaking.stakeOf(validator.address);

        const liquidDebtBeforeNewPosition = await hydraStaking.liquidityDebts(validator.address);
        expect(liquidDebtBeforeNewPosition).to.be.equal(0);

        await hydraStaking.connect(validator).stakeWithVesting(1, { value: this.minDelegation });
        const expectedLiquidTokensFromPosition = calcLiquidTokensToDistributeOnVesting(
          1,
          stakedAmount.add(this.minDelegation)
        );
        const liquidDebtForPosition = stakedAmount.add(this.minDelegation).sub(expectedLiquidTokensFromPosition);
        expect(await hydraStaking.liquidityDebts(validator.address)).to.be.equal(liquidDebtForPosition.mul(-1));

        // commit epochs and increase time to mature the position
        await commitEpochs(systemHydraChain, hydraStaking, [validator], 3, this.epochSize, WEEK);

        await hydraStaking.connect(validator).stakeWithVesting(52, { value: this.minDelegation.mul(5) });
        const expectedLiquidTokensFromNewPosition = calcLiquidTokensToDistributeOnVesting(
          52,
          this.minDelegation.mul(6).add(stakedAmount)
        );
        const liquidDebtForNewPosition = this.minDelegation
          .mul(6)
          .add(stakedAmount)
          .sub(expectedLiquidTokensFromNewPosition);
        expect(await hydraStaking.liquidityDebts(validator.address)).to.be.equal(liquidDebtForNewPosition.mul(-1));

        await hydraStaking.connect(validator).unstake(this.minDelegation);

        expect(await hydraStaking.liquidityDebts(validator.address)).to.be.equal(
          liquidDebtForNewPosition.sub(this.minDelegation).mul(-1)
        );
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
        const { penalty, rewardToBurn } = await hydraStaking.calcVestedStakingPositionPenalty(
          this.staker.address,
          this.minStake
        );

        // calculate penalty locally
        const calculatedPenalty = await calculatePenalty(position, latestTimestamp, this.minStake);

        expect(penalty, "penalty").to.be.gt(0);
        expect(penalty, "penalty = calculatedPenalty").to.be.equal(calculatedPenalty);
        expect(rewardToBurn, "rewardToBurn").to.be.gt(0); // if active position, reward is burned
      });

      it("should decrease staking position and apply slashing penalty", async function () {
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
        const { stakerHydraStaking, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        //  we already take the reward when opening the position
        await expect(stakerHydraStaking["claimStakingRewards()"]()).to.be.revertedWithCustomError(
          stakerHydraStaking,
          "NoRewards"
        );

        const reward = await getValidatorReward(hydraStaking, this.staker.address);
        expect(reward).to.be.gt(0);
      });

      it("should revert claimValidatorReward(epoch) when giving wrong index", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

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
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

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
          this.fixtures.newVestingValidatorFixture
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

    describe("calculatePositionTotalReward()", async function () {
      it("should be bigger than claimable when maturing", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        // add reward exactly before maturing (second to the last block)
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        await time.setNextBlockTimestamp(position.end.sub(1).toNumber());
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // calculate up to which epoch rewards are matured
        const valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
        const valRewardHistoryRecordIndex = findProperRPSIndex(
          valRewardsHistoryRecords,
          position.end.sub(position.duration.div(2))
        );

        // enter maturing state
        const nextTimestampMaturing = position.end.add(position.duration.div(2));
        await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());
        await mine();

        const claimableRewards = await hydraStaking.calculatePositionClaimableReward(
          this.staker.address,
          valRewardHistoryRecordIndex
        );
        const totalRewards = await hydraStaking.calculatePositionTotalReward(this.staker.address);

        expect(totalRewards).to.be.gt(claimableRewards);
      });
    });

    describe("calculatePositionClaimableReward()", async function () {
      it("should return zero in case active position", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        expect(await hydraStaking.calculatePositionClaimableReward(this.staker.address, 0)).to.be.eq(0);
      });

      it("should return all rewards in case matured", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

        // add reward exactly before maturing (second to the last block)
        const position = await hydraStaking.vestedStakingPositions(this.staker.address);
        await time.setNextBlockTimestamp(position.end.sub(1).toNumber());
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.staker],
          1, // number of epochs to commit
          this.epochSize
        );

        // enter matured state
        await time.setNextBlockTimestamp(position.end.add(position.duration).toNumber());
        await mine();

        const claimableRewards = await hydraStaking.calculatePositionClaimableReward(this.staker.address, 0);
        const totalRewards = await hydraStaking.calculatePositionTotalReward(this.staker.address);

        expect(totalRewards).to.be.eq(claimableRewards);
      });
    });

    describe("penaltyDecreasePerWeek()", async function () {
      it("should revert setting penalty decrease per week if not Governance", async function () {
        const { hydraStaking, delegatedValidator } = await loadFixture(this.fixtures.vestedDelegationFixture);

        await expect(hydraStaking.connect(delegatedValidator).setPenaltyDecreasePerWeek(100))
          .to.be.revertedWithCustomError(hydraStaking, "Unauthorized")
          .withArgs(ERRORS.unauthorized.governanceArg);
      });

      it("should revert setting penalty decrease per week if amount out of range", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.vestedDelegationFixture);

        await expect(
          hydraStaking.connect(this.signers.governance).setPenaltyDecreasePerWeek(9)
        ).to.be.revertedWithCustomError(hydraStaking, "PenaltyRateOutOfRange");

        await expect(
          hydraStaking.connect(this.signers.governance).setPenaltyDecreasePerWeek(151)
        ).to.be.revertedWithCustomError(hydraStaking, "PenaltyRateOutOfRange");
      });

      it("should set penalty decrease per week", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.vestedDelegationFixture);

        await hydraStaking.connect(this.signers.governance).setPenaltyDecreasePerWeek(100);
        expect(await hydraStaking.penaltyDecreasePerWeek()).to.be.eq(100);
      });
    });
  });
}
