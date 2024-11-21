/* eslint-disable node/no-extraneous-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import { calculatePenaltyByWeeks, commitEpochs } from "../helper";
import { BAN_THRESHOLD, ERRORS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
// eslint-disable-next-line camelcase
import { LiquidityToken__factory } from "../../typechain-types";

export function RunInspectorTests(): void {
  describe("setValidatorPenalty", function () {
    it("should revert not owner when try to set validator penalty", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      await expect(hydraChain.connect(this.signers.validators[0]).setValidatorPenalty(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new validator penalty", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newValidatorPenalty = 10;
      await hydraChain.connect(this.signers.governance).setValidatorPenalty(newValidatorPenalty);
      expect(await hydraChain.validatorPenalty()).to.be.equal(newValidatorPenalty);
    });
  });

  describe("setReporterReward", function () {
    it("should revert not owner when try to set reporter reward", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).setReporterReward(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new reporter reward", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newReporterReward = 5;
      await hydraChain.connect(this.signers.governance).setReporterReward(newReporterReward);
      expect(await hydraChain.reporterReward()).to.be.equal(newReporterReward);
    });
  });

  describe("setInitiateBanThreshold", function () {
    it("should revert not owner when try to set initiate ban threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).setBanThreshold(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new initiate ban threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newBanThreshold = 100;
      await hydraChain.connect(this.signers.governance).setBanThreshold(newBanThreshold);
      expect(await hydraChain.banThreshold()).to.be.equal(newBanThreshold);
    });
  });

  describe("setBanThreshold", function () {
    it("should revert not owner when try to set ban finish threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).setBanThreshold(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new ban finish threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newBanThreshold = 60 * 60 * 25; // 25 hours
      await hydraChain.connect(this.signers.governance).setBanThreshold(newBanThreshold);
      expect(await hydraChain.banThreshold()).to.be.equal(newBanThreshold);
    });
  });

  describe("Ban a validator", function () {
    it("should revert when ban already initiated", async function () {
      const { hydraChain, inBanProcessValidator } = await loadFixture(this.fixtures.banInitiatedFixtureFunction);

      await expect(hydraChain.initiateBan(inBanProcessValidator.address)).to.be.revertedWithCustomError(
        hydraChain,
        "BanAlreadyInitiated"
      );
    });

    it("should revert when the validator NoInitiateBanSubject (not active)", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      await expect(hydraChain.initiateBan(this.signers.validators[0].address)).to.be.revertedWithCustomError(
        hydraChain,
        "NoInitiateBanSubject"
      );
    });

    it("should revert when the validator is active from less than the initiate threshold", async function () {
      const { hydraChain, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.stakedValidatorsStateFixture
      );

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(hydraChain.initiateBan(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(hydraChain, "NoInitiateBanSubject")
        .withArgs();
    });

    it("should revert when the validator is active for long time and have not met the initiate threshold", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(systemHydraChain.initiateBan(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(systemHydraChain, "NoInitiateBanSubject")
        .withArgs();
    });

    it("should not initiate ban for a validator that have just staked, but has no uptime", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

      await hydraStaking.connect(this.signers.validators[3]).stake({ value: this.minStake });

      const validatorsParticipation = await hydraChain.validatorsParticipation(this.signers.validators[3].address);
      expect(validatorsParticipation).to.be.not.equal(0);
      await expect(hydraChain.initiateBan(this.signers.validators[3].address))
        .to.be.revertedWithCustomError(hydraChain, "NoInitiateBanSubject")
        .withArgs();
    });

    it("should not initiate ban for a validator if he is not active, and on exit he has not reached ban threshold", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.validatorToBanFixture);

      const valStake = await hydraStaking.stakeOf(this.signers.validators[1].address);
      await hydraStaking.connect(this.signers.validators[1]).unstake(valStake);

      // commit epochs, but without the validator that will be banned
      await commitEpochs(
        hydraChain.connect(this.signers.system),
        hydraStaking,
        [this.signers.validators[2]],
        10, // number of epochs to commit
        this.epochSize
      );

      const validatorsParticipation = await hydraChain.validatorsParticipation(this.signers.validators[1].address);
      expect(validatorsParticipation).to.be.not.equal(0);
      await expect(hydraChain.initiateBan(this.signers.validators[1].address))
        .to.be.revertedWithCustomError(hydraChain, "NoInitiateBanSubject")
        .withArgs();
    });

    it("should not initiate ban for a validator, if he is not Active anymore (he unstake on his own)", async function () {
      const { hydraChain, validatorToBan, hydraStaking } = await loadFixture(this.fixtures.validatorToBanFixture);

      const stakedAmount = await hydraStaking.stakeOf(validatorToBan.address);
      await hydraStaking.connect(validatorToBan).unstake(stakedAmount);

      await expect(hydraChain.initiateBan(validatorToBan.address)).to.be.revertedWithCustomError(
        hydraChain,
        "NoInitiateBanSubject"
      );
    });

    it("should initiate ban for a validator", async function () {
      const { hydraChain, validatorToBan, hydraStaking } = await loadFixture(this.fixtures.validatorToBanFixture);

      await expect(hydraChain.initiateBan(validatorToBan.address))
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(validatorToBan.address, 0);

      expect((await hydraChain.getValidator(validatorToBan.address)).isBanInitiated).to.be.equal(true);
    });

    it("should lock commission for staker on initiate ban", async function () {
      const { hydraChain, validatorToBan, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.validatorToBanFixture
      );

      await expect(hydraChain.initiateBan(validatorToBan.address))
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(validatorToBan.address, 0);

      expect((await hydraChain.getValidator(validatorToBan.address)).isBanInitiated).to.be.equal(true);
      expect(await hydraDelegation.commissionRewardLocked(validatorToBan.address)).to.be.equal(true);

      await expect(
        hydraDelegation.connect(validatorToBan).claimCommission(validatorToBan.address)
      ).to.be.revertedWithCustomError(hydraDelegation, "CommissionRewardLocked");
    });

    it("should ban a validator that has a vested staking position", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);
      await systemHydraChain.connect(this.signers.governance).setValidatorPenalty(this.minStake.div(10));

      const staker = this.signers.accounts[9];
      const stake = await hydraStaking.stakeOf(staker.address);
      const vestingData = await hydraStaking.vestedStakingPositions(staker.address);
      const nextTimestamp = vestingData.start.add(WEEK);
      await time.setNextBlockTimestamp(nextTimestamp);

      const validatorBanPenalty = await systemHydraChain.validatorPenalty();
      // hardcode the penalty percent by 1% a week (9 weeks should be left)
      const unstakePenalty = await calculatePenaltyByWeeks(VESTING_DURATION_WEEKS - 1, stake);
      const stakedAmount = await hydraStaking.stakeOf(staker.address);

      // check the staking rewards before the ban
      const rewardsBefore = await hydraStaking.stakingRewards(staker.address);
      expect(rewardsBefore.total).to.be.not.equal(rewardsBefore.taken);

      const stakedAmountAfterPenalty = stakedAmount.sub(unstakePenalty).sub(validatorBanPenalty);
      const banTx = await systemHydraChain.connect(this.signers.governance).banValidator(staker.address);
      const withdrawableAmount = await hydraStaking.leftToWithdrawPerStaker(staker.address);

      await expect(banTx, "ValidatorBanned").to.emit(systemHydraChain, "ValidatorBanned").withArgs(staker.address);
      expect(withdrawableAmount, "withdrawable").to.be.equal(stakedAmountAfterPenalty);

      // the staker should not have claimable rewards after the ban
      const rewards = await hydraStaking.stakingRewards(staker.address);
      expect(rewards.total).to.be.equal(rewards.taken);

      const liquidTokensThatMustBeCollected = (await hydraStaking.liquidityDebts(staker.address)).add(
        withdrawableAmount
      );
      await expect(hydraStaking.connect(staker).withdrawBannedFunds(), "liquidTokens collect").to.changeTokenBalance(
        LiquidityToken__factory.connect(await hydraStaking.liquidToken(), ethers.provider),
        staker.address,
        liquidTokensThatMustBeCollected.mul(-1)
      );
    });

    it("should not finish ban when ban not initiated", async function () {
      const { hydraChain, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

      await expect(hydraChain.banValidator(validatorToBan.address)).to.be.revertedWithCustomError(
        hydraChain,
        "NoBanSubject"
      );
    });

    it("should not finish ban when threshold not passed", async function () {
      const { hydraChain, inBanProcessValidator } = await loadFixture(this.fixtures.banInitiatedFixtureFunction);

      await expect(hydraChain.banValidator(inBanProcessValidator.address)).to.be.revertedWithCustomError(
        hydraChain,
        "NoBanSubject"
      );
    });

    it("should not terminate ban process when such one not created", async function () {
      const { hydraChain, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

      await expect(hydraChain.connect(validatorToBan).terminateBanProcedure()).to.be.revertedWithCustomError(
        hydraChain,
        "NoBanInitiated"
      );
    });

    it("should terminate ban process", async function () {
      const { hydraChain, inBanProcessValidator, hydraStaking } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      const validatorParticipationBefore = await hydraChain.validatorsParticipation(inBanProcessValidator.address);

      await expect(hydraChain.connect(inBanProcessValidator).terminateBanProcedure(), "emit BalanceChanged")
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(inBanProcessValidator.address, this.minStake.mul(2));

      expect(
        (await hydraChain.getValidator(inBanProcessValidator.address)).isBanInitiated,
        "isBanInitiated"
      ).to.be.equal(false);

      const validatorParticipationAfter = await hydraChain.validatorsParticipation(inBanProcessValidator.address);
      expect(validatorParticipationAfter).to.not.be.equal(validatorParticipationBefore);
    });

    it("should unlock commission for staker on terminate ban", async function () {
      const { hydraChain, inBanProcessValidator, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await expect(hydraChain.connect(inBanProcessValidator).terminateBanProcedure(), "emit BalanceChanged")
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(inBanProcessValidator.address, this.minStake.mul(2));

      expect(
        (await hydraChain.getValidator(inBanProcessValidator.address)).isBanInitiated,
        "isBanInitiated"
      ).to.be.equal(false);

      expect(await hydraDelegation.commissionRewardLocked(inBanProcessValidator.address)).to.be.equal(false);
    });

    it("should finish ban and penalize the validator", async function () {
      const { hydraChain, inBanProcessValidator, hydraStaking } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      // check the staking rewards before the ban
      const rewardsBefore = await hydraStaking.stakingRewards(inBanProcessValidator.address);
      expect(rewardsBefore.total).to.be.not.equal(rewardsBefore.taken);

      const stakedAmount = await hydraStaking.stakeOf(inBanProcessValidator.address);
      const banTx = await hydraChain.banValidator(inBanProcessValidator.address);
      const reporterReward = await hydraChain.reporterReward();
      const validatorBanPenalty = await hydraChain.validatorPenalty();
      const withdrawableAmount = await hydraStaking.leftToWithdrawPerStaker(inBanProcessValidator.address);

      // the staker should not have claimable rewards after the ban
      const rewards = await hydraStaking.stakingRewards(inBanProcessValidator.address);
      expect(rewards.total).to.be.equal(rewards.taken);

      expect(await hydraStaking.stakeOf(inBanProcessValidator.address), "stakedOf").to.be.eq(0);
      expect(withdrawableAmount, "withdrawableAmount").to.be.equal(
        stakedAmount.sub(reporterReward).sub(validatorBanPenalty)
      );
      await expect(banTx, "BalanceChanged event")
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(inBanProcessValidator.address, 0);
      // penalty is burned immediately from the contract
      await expect(banTx, "withdrawn reward").to.changeEtherBalances(
        [hydraStaking.address, ethers.constants.AddressZero],
        [validatorBanPenalty.mul(-1), validatorBanPenalty]
      );
      // reporter must withdraw its reward after a given period
      expect(await hydraStaking.pendingWithdrawals(await hydraChain.signer.getAddress())).to.eq(reporterReward);

      const liquidTokensThatMustBeCollected = (await hydraStaking.liquidityDebts(inBanProcessValidator.address)).add(
        withdrawableAmount
      );
      await expect(
        hydraStaking.connect(inBanProcessValidator).withdrawBannedFunds(),
        "liquidTokens collect"
      ).to.changeTokenBalance(
        LiquidityToken__factory.connect(await hydraStaking.liquidToken(), ethers.provider),
        inBanProcessValidator.address,
        liquidTokensThatMustBeCollected.mul(-1)
      );

      expect(await hydraChain.bansInitiated(inBanProcessValidator.address)).to.eq(0);
    });

    it("should emit WithdrawalRegistered event for the reporter with the report reward", async function () {
      const { hydraChain, hydraStaking, inBanProcessValidator } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      const reporterReward = await hydraChain.reporterReward();
      const banTx = await hydraChain.connect(this.signers.delegator).banValidator(inBanProcessValidator.address);
      await expect(banTx, "banTx")
        .to.emit(hydraStaking, "WithdrawalRegistered")
        .withArgs(this.signers.delegator.address, reporterReward);
    });

    it("should emit WithdrawalFinished event for 0 address with validator penalty", async function () {
      const { hydraChain, hydraStaking, inBanProcessValidator } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      const validatorBanPenalty = await hydraChain.validatorPenalty();
      const banTx = await hydraChain.banValidator(inBanProcessValidator.address);
      await expect(banTx, "banTx")
        .to.emit(hydraStaking, "WithdrawalFinished")
        .withArgs(hydraStaking.address, ethers.constants.AddressZero, validatorBanPenalty);
    });

    it("should increase liquidityDebts correctly on ban", async function () {
      const { hydraChain, hydraStaking, inBanProcessValidator } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      const stake = await hydraStaking.stakeOf(inBanProcessValidator.address);
      const validatorBanPenalty = await hydraChain.validatorPenalty();
      const reporterReward = await hydraChain.reporterReward();
      const leftForStaker = stake.sub(reporterReward).sub(validatorBanPenalty);

      const liquidityDebtsBefore = await hydraStaking.liquidityDebts(inBanProcessValidator.address);
      await hydraChain.banValidator(inBanProcessValidator.address);
      const liquidityDebtsAfter = await hydraStaking.liquidityDebts(inBanProcessValidator.address);

      expect(liquidityDebtsBefore, "liquidityDebtsBefore").to.equal(0);
      expect(liquidityDebtsAfter, "liquidityDebtsAfter").to.equal(stake.sub(leftForStaker));
    });

    it("should unstake all funds & emit event on ban", async function () {
      const { hydraChain, hydraStaking, inBanProcessValidator } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      const stake = await hydraStaking.stakeOf(inBanProcessValidator.address);

      expect(await hydraStaking.stakeOf(inBanProcessValidator.address)).to.be.above(0);

      const banTx = await hydraChain.banValidator(inBanProcessValidator.address);
      await expect(banTx, "banTx").to.emit(hydraStaking, "Unstaked").withArgs(inBanProcessValidator.address, stake);
      expect(await hydraStaking.stakeOf(inBanProcessValidator.address)).to.equal(0);
    });

    it("should not add funds to withdraw queue on ban for the banned validator", async function () {
      const { hydraChain, hydraStaking, inBanProcessValidator } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      await hydraChain.banValidator(inBanProcessValidator.address);
      expect(await hydraStaking.pendingWithdrawals(inBanProcessValidator.address)).to.equal(0);
    });

    it("should get only reporter reward, because it is more than the stake", async function () {
      const { hydraChain, inBanProcessValidator, hydraStaking } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      const stakedAmount = await hydraStaking.stakeOf(inBanProcessValidator.address);

      await hydraChain.connect(this.signers.governance).setReporterReward(stakedAmount.mul(2));

      const banTx = await hydraChain.banValidator(inBanProcessValidator.address);

      const withdrawalBalance = await hydraStaking.leftToWithdrawPerStaker(inBanProcessValidator.address);

      expect(withdrawalBalance, "withdrawableAmount").to.be.equal(0);
      await expect(banTx, "withdrawn reward").to.changeEtherBalances(
        [hydraStaking.address, ethers.constants.AddressZero],
        [0, 0]
      );
      await expect(banTx, "emit WithdrawalRegistered")
        .to.emit(hydraStaking, "WithdrawalRegistered")
        .withArgs(this.signers.accounts[0].address, stakedAmount);
      await expect(banTx, "emit WithdrawalFinished").to.not.emit(hydraStaking, "WithdrawalFinished");
      expect(await hydraStaking.pendingWithdrawals(await hydraChain.signer.getAddress())).to.eq(stakedAmount);
    });

    it("should get reporter reward, but to penalize the whole stake when penalty is more than the stake", async function () {
      const { hydraChain, inBanProcessValidator, hydraStaking } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await time.increase(BAN_THRESHOLD);

      const stakedAmount = await hydraStaking.stakeOf(inBanProcessValidator.address);
      await hydraChain.connect(this.signers.governance).setValidatorPenalty(stakedAmount.mul(2));

      const banTx = await hydraChain.banValidator(inBanProcessValidator.address);
      const reporterReward = await hydraChain.reporterReward();
      const withdrawalBalance = await hydraStaking.leftToWithdrawPerStaker(inBanProcessValidator.address);

      expect(withdrawalBalance).to.be.equal(0);
      await expect(banTx).to.changeEtherBalances(
        [hydraStaking.address, ethers.constants.AddressZero],
        [stakedAmount.sub(reporterReward).mul(-1), stakedAmount.sub(reporterReward)] // reporter reward is added to withdrawable, so reported can withdraw it in a separate tx
      );
      await expect(banTx, "emit WithdrawalFinished")
        .to.emit(hydraStaking, "WithdrawalFinished")
        .withArgs(hydraStaking.address, ethers.constants.AddressZero, stakedAmount.sub(reporterReward));
      expect(await hydraStaking.pendingWithdrawals(await hydraChain.signer.getAddress())).to.eq(reporterReward);
    });

    it("should ban the validator even if threshold is not met, if called from the contract owner (governance)", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(systemHydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.not.be.reverted;
    });

    it("should not ban validator if he is already banned", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(systemHydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.not.be.reverted;

      await expect(
        systemHydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address)
      ).to.be.revertedWithCustomError(systemHydraChain, "NoBanSubject");
    });

    it("should set bansInitiate to 0 on ban", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.banInitiatedFixtureFunction);

      expect(await hydraChain.bansInitiated(this.signers.validators[0].address)).to.not.be.equal(0);

      await expect(hydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address)).to.not
        .be.reverted;

      expect(await hydraChain.bansInitiated(this.signers.validators[0].address)).to.be.equal(0);
    });

    it("should revert stake when ban in initiated", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.banInitiatedFixtureFunction);

      expect(await hydraChain.bansInitiated(this.signers.validators[0].address)).to.not.be.equal(0);

      await expect(hydraStaking.connect(this.signers.validators[0]).stake({ value: this.minStake }))
        .to.be.revertedWithCustomError(hydraStaking, "Unauthorized")
        .withArgs("BAN_INITIATED");
    });

    it("should revert unstake when ban in initiated", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.banInitiatedFixtureFunction);

      expect(await hydraChain.bansInitiated(this.signers.validators[0].address)).to.not.be.equal(0);

      await expect(
        hydraStaking
          .connect(this.signers.validators[0])
          .unstake(await hydraStaking.stakeOf(this.signers.validators[0].address))
      )
        .to.be.revertedWithCustomError(hydraStaking, "Unauthorized")
        .withArgs("BAN_INITIATED");
    });

    it("should not emit event BalanceChanged on delegate if ban is initiated", async function () {
      const { hydraChain, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      expect(await hydraChain.bansInitiated(this.signers.validators[0].address)).to.not.be.equal(0);

      await expect(
        hydraDelegation
          .connect(this.signers.delegator)
          .delegate(this.signers.validators[0].address, { value: this.minDelegation })
      ).to.not.emit(hydraStaking, "BalanceChanged");
    });

    it("should not emit event BalanceChanged on undelegate if ban is initiated", async function () {
      const { hydraChain, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.banInitiatedFixtureFunction
      );

      await hydraDelegation
        .connect(this.signers.delegator)
        .delegate(this.signers.validators[0].address, { value: this.minDelegation });

      expect(await hydraChain.bansInitiated(this.signers.validators[0].address)).to.not.be.equal(0);

      await expect(
        hydraDelegation
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, this.minDelegation)
      ).to.not.emit(hydraStaking, "BalanceChanged");
    });
  });

  describe("Withdraw banned funds", function () {
    it("should fail the withdrawal when there are no funds in the hydraStaking", async function () {
      const { bannedValidator, hydraStaking } = await loadFixture(this.fixtures.bannedValidatorFixture);

      // clear the contract's balance in order to force withdrawal fail
      setBalance(hydraStaking.address, 0);
      await expect(hydraStaking.connect(bannedValidator).withdrawBannedFunds()).to.be.revertedWithCustomError(
        hydraStaking,
        "WithdrawalFailed"
      );
    });

    it("should revert when trying to withdraw banned funds when there is none to withdraw", async function () {
      const { bannedValidator, hydraStaking } = await loadFixture(this.fixtures.bannedValidatorFixture);

      await hydraStaking.connect(bannedValidator).withdrawBannedFunds();
      expect(await hydraStaking.connect(bannedValidator).leftToWithdrawPerStaker(bannedValidator.address)).to.be.equal(
        0
      );
      await expect(hydraStaking.connect(bannedValidator).withdrawBannedFunds()).to.be.revertedWithCustomError(
        hydraStaking,
        "NoFundsToWithdraw"
      );
    });

    it("should successfully withdraw the funds", async function () {
      const { hydraChain, liquidToken, bannedValidator, stakedAmount, hydraStaking } = await loadFixture(
        this.fixtures.bannedValidatorFixture
      );

      const validatorBanPenalty = await hydraChain.validatorPenalty();
      const withdrawAmount = stakedAmount.sub(validatorBanPenalty);
      const withdrawTx = await hydraStaking.connect(bannedValidator).withdrawBannedFunds();

      await expect(withdrawTx, "emit Transfer")
        .to.emit(liquidToken, "Transfer")
        .withArgs(bannedValidator.address, ethers.constants.AddressZero, stakedAmount);
      expect(await liquidToken.balanceOf(bannedValidator.address), "lydra balanceOf").to.be.equal(0);
      await expect(withdrawTx, "emit WithdrawalFinished")
        .to.emit(hydraStaking, "WithdrawalFinished")
        .withArgs(hydraStaking.address, bannedValidator.address, withdrawAmount);
      await expect(withdrawTx, "change balances").to.changeEtherBalances(
        [hydraStaking.address, bannedValidator.address],
        [withdrawAmount.mul(-1), withdrawAmount]
      );

      const withdrawalBalance = await hydraStaking.leftToWithdrawPerStaker(bannedValidator.address);
      expect(withdrawalBalance, "withdrawalBalance.withdrawableAmount").to.be.equal(0);
      expect(await hydraStaking.liquidityDebts(bannedValidator.address)).to.be.equal(0);
    });
  });
}
