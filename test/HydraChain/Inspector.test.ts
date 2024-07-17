/* eslint-disable node/no-extraneous-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import { calculatePenaltyByWeeks, commitEpochs } from "../helper";
import { ERRORS, VALIDATOR_STATUS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
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

  describe("setBanThreshold", function () {
    it("should revert not owner when try to set ban threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).setBanThreshold(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new ban threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newBanThreshold = 100;
      await hydraChain.connect(this.signers.governance).setBanThreshold(newBanThreshold);
      expect(await hydraChain.banThreshold()).to.be.equal(newBanThreshold);
    });
  });

  describe("Ban a validator", function () {
    it("should revert when the validator NoBanSubject (not register, nor active)", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      await expect(hydraChain.banValidator(this.signers.validators[0].address)).to.be.revertedWithCustomError(
        hydraChain,
        "NoBanSubject"
      );
    });

    it("should revert when the validator is active from less than the threshold", async function () {
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

      await expect(hydraChain.banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(hydraChain, "NoBanSubject")
        .withArgs();
    });

    it("should revert when the validator is active for long time and have not met the threshold", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(systemHydraChain.banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(systemHydraChain, "NoBanSubject")
        .withArgs();
    });

    it("should ban a validator that has a vested staking position", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);
      await systemHydraChain.connect(this.signers.governance).setValidatorPenalty(this.minStake.div(10));

      const staker = this.signers.accounts[9];
      const vestingData = await hydraStaking.vestedStakingPositions(staker.address);
      const nextTimestamp = vestingData.start.add(WEEK);
      await time.setNextBlockTimestamp(nextTimestamp);

      const validatorBanPenalty = await systemHydraChain.validatorPenalty();
      // hardcode the penalty percent by 1% a week (9 weeks should be left)
      const unstakePenalty = await calculatePenaltyByWeeks(VESTING_DURATION_WEEKS - 1, this.minStake);
      const stakedAmount = await hydraStaking.stakeOf(staker.address);

      const stakedAmountAfterPenalty = stakedAmount.sub(unstakePenalty).sub(validatorBanPenalty);
      const banTx = await systemHydraChain.connect(this.signers.governance).banValidator(staker.address);
      const withdrawableAmount = await hydraStaking.leftToWithdrawPerStaker(staker.address);

      await expect(banTx, "ValidatorBanned").to.emit(systemHydraChain, "ValidatorBanned").withArgs(staker.address);
      expect(withdrawableAmount, "withdrawable").to.be.equal(stakedAmountAfterPenalty);

      const liquidTokensThatMustBeCollected = (await hydraStaking.liquidityDebts(staker.address)).add(
        withdrawableAmount
      );
      await expect(hydraStaking.connect(staker).withdrawBannedFunds(), "liquidTokens collect").to.changeTokenBalance(
        LiquidityToken__factory.connect(await hydraStaking.liquidToken(), ethers.provider),
        staker.address,
        liquidTokensThatMustBeCollected.mul(-1)
      );
    });

    it("should ban the validator, even if he succeeded to unstake before that", async function () {
      const { hydraChain, validatorToBan, hydraStaking } = await loadFixture(this.fixtures.validatorToBanFixture);

      const stakedAmount = await hydraStaking.stakeOf(validatorToBan.address);
      await hydraStaking.connect(validatorToBan).unstake(stakedAmount);

      const banTx = await hydraChain.banValidator(validatorToBan.address);

      expect((await hydraChain.validators(validatorToBan.address)).status, "status").to.be.equal(
        VALIDATOR_STATUS.Banned
      );
      expect((await hydraChain.getValidator(validatorToBan.address)).active, "active").to.be.equal(false);
      expect(await hydraStaking.stakeOf(validatorToBan.address), "balanceOf").to.be.equal(0);
      await expect(banTx, "ValidatorBanned").to.emit(hydraChain, "ValidatorBanned").withArgs(validatorToBan.address);
    });

    it("should ban and penalize the validator", async function () {
      const { hydraChain, validatorToBan, hydraStaking } = await loadFixture(this.fixtures.validatorToBanFixture);
      const stakedAmount = await hydraStaking.stakeOf(validatorToBan.address);
      const banTx = await hydraChain.banValidator(validatorToBan.address);
      const reporterReward = await hydraChain.reporterReward();
      const validatorBanPenalty = await hydraChain.validatorPenalty();
      const withdrawableAmount = await hydraStaking.leftToWithdrawPerStaker(validatorToBan.address);

      expect(await hydraStaking.stakeOf(validatorToBan.address), "stakedOf").to.be.eq(0);
      expect(withdrawableAmount, "withdrawableAmount").to.be.equal(
        stakedAmount.sub(reporterReward).sub(validatorBanPenalty)
      );
      await expect(banTx, "BalanceChanged event")
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(validatorToBan.address, 0);
      // penalty is burned immediately from the contract
      await expect(banTx, "withdrawn reward").to.changeEtherBalances(
        [hydraStaking.address, ethers.constants.AddressZero],
        [validatorBanPenalty.mul(-1), validatorBanPenalty]
      );
      // reporter must withdraw its reward after a given period
      expect(await hydraStaking.pendingWithdrawals(await hydraChain.signer.getAddress())).to.eq(reporterReward);

      const liquidTokensThatMustBeCollected = (await hydraStaking.liquidityDebts(validatorToBan.address)).add(
        withdrawableAmount
      );
      await expect(
        hydraStaking.connect(validatorToBan).withdrawBannedFunds(),
        "liquidTokens collect"
      ).to.changeTokenBalance(
        LiquidityToken__factory.connect(await hydraStaking.liquidToken(), ethers.provider),
        validatorToBan.address,
        liquidTokensThatMustBeCollected.mul(-1)
      );
    });

    it("should emit WithdrawalRegistered event for the reporter with the report reward", async function () {
      const { hydraChain, hydraStaking, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

      const reporterReward = await hydraChain.reporterReward();
      const banTx = await hydraChain.connect(this.signers.delegator).banValidator(validatorToBan.address);
      await expect(banTx, "banTx")
        .to.emit(hydraStaking, "WithdrawalRegistered")
        .withArgs(this.signers.delegator.address, reporterReward);
    });

    it("should emit WithdrawalFinished event for 0 address with validator penalty", async function () {
      const { hydraChain, hydraStaking, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

      const validatorBanPenalty = await hydraChain.validatorPenalty();
      const banTx = await hydraChain.banValidator(validatorToBan.address);
      await expect(banTx, "banTx")
        .to.emit(hydraStaking, "WithdrawalFinished")
        .withArgs(hydraStaking.address, ethers.constants.AddressZero, validatorBanPenalty);
    });

    it("should increase liquidityDebts correctly on ban", async function () {
      const { hydraChain, hydraStaking, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);
      const stake = await hydraStaking.stakeOf(validatorToBan.address);

      const validatorBanPenalty = await hydraChain.validatorPenalty();
      const reporterReward = await hydraChain.reporterReward();
      const leftForStaker = stake.sub(reporterReward).sub(validatorBanPenalty);

      const liquidityDebtsBefore = await hydraStaking.liquidityDebts(validatorToBan.address);
      await hydraChain.banValidator(validatorToBan.address);
      const liquidityDebtsAfter = await hydraStaking.liquidityDebts(validatorToBan.address);

      expect(liquidityDebtsBefore, "liquidityDebtsBefore").to.equal(0);
      expect(liquidityDebtsAfter, "liquidityDebtsAfter").to.equal(stake.sub(leftForStaker));
    });

    it("should unstake all funds & emit event on ban", async function () {
      const { hydraChain, hydraStaking, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);
      const stake = await hydraStaking.stakeOf(validatorToBan.address);

      expect(await hydraStaking.stakeOf(validatorToBan.address)).to.be.above(0);

      const banTx = await hydraChain.banValidator(validatorToBan.address);
      await expect(banTx, "banTx").to.emit(hydraStaking, "Unstaked").withArgs(validatorToBan.address, stake);
      expect(await hydraStaking.stakeOf(validatorToBan.address)).to.equal(0);
    });

    it("should not add funds to withdraw queue on ban for the banned validator", async function () {
      const { hydraChain, hydraStaking, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

      await hydraChain.banValidator(validatorToBan.address);
      expect(await hydraStaking.pendingWithdrawals(validatorToBan.address)).to.equal(0);
    });

    it("should get only reporter reward, because it is more than the stake", async function () {
      const { hydraChain, validatorToBan, hydraStaking } = await loadFixture(this.fixtures.validatorToBanFixture);

      const stakedAmount = await hydraStaking.stakeOf(validatorToBan.address);

      await hydraChain.connect(this.signers.governance).setReporterReward(stakedAmount.mul(2));

      const banTx = await hydraChain.banValidator(validatorToBan.address);

      const withdrawalBalance = await hydraStaking.leftToWithdrawPerStaker(validatorToBan.address);

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

    it("should get reporter reward, but to penalyze the whole stake when penalty is more than the stake", async function () {
      const { hydraChain, validatorToBan, hydraStaking } = await loadFixture(this.fixtures.validatorToBanFixture);
      const stakedAmount = await hydraStaking.stakeOf(validatorToBan.address);
      await hydraChain.connect(this.signers.governance).setValidatorPenalty(stakedAmount.mul(2));

      const banTx = await hydraChain.banValidator(validatorToBan.address);
      const reporterReward = await hydraChain.reporterReward();
      const withdrawalBalance = await hydraStaking.leftToWithdrawPerStaker(validatorToBan.address);

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

    it("should ban the validator even if threshold is not met, if called from the contract owner", async function () {
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
  });

  describe("Withdraw banned funds", function () {
    it("should revert when trying to withdraw from non banned validator", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.bannedValidatorFixture);

      await expect(hydraStaking.connect(this.signers.validators[2]).withdrawBannedFunds())
        .to.be.revertedWithCustomError(hydraStaking, "ValidatorNotBanned")
        .withArgs(this.signers.validators[2].address);
    });

    it("should fail the withdrawal when there are no funds in the hydraStaking", async function () {
      const { bannedValidator, hydraStaking } = await loadFixture(this.fixtures.bannedValidatorFixture);

      // clear the contract's balance in order to force withdrawal fail
      setBalance(hydraStaking.address, 0);
      await expect(hydraStaking.connect(bannedValidator).withdrawBannedFunds()).to.be.revertedWith("WITHDRAWAL_FAILED");
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
