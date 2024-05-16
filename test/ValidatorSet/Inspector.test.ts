/* eslint-disable node/no-extraneous-import */
import { loadFixture, time, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { DENOMINATOR, ERRORS, VALIDATOR_STATUS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
import { ethers } from "hardhat";
import { commitEpochs } from "../helper";

export function RunInspectorTests(): void {
  describe("setValidatorPenalty", function () {
    it("should revert not owner when try to set validator penalty", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(validatorSet.connect(this.signers.validators[0]).setValidatorPenalty(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new validator penalty", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newValidatorPenalty = 10;
      await validatorSet.connect(this.signers.governance).setValidatorPenalty(newValidatorPenalty);
      expect(await validatorSet.validatorPenalty()).to.be.equal(newValidatorPenalty);
    });
  });

  describe("setReporterReward", function () {
    it("should revert not owner when try to set reporter reward", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(validatorSet.connect(this.signers.validators[0]).setReporterReward(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new reporter reward", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newReporterReward = 5;
      await validatorSet.connect(this.signers.governance).setReporterReward(newReporterReward);
      expect(await validatorSet.reporterReward()).to.be.equal(newReporterReward);
    });
  });

  describe("setBanThreshold", function () {
    it("should revert not owner when try to set ban threshold", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(validatorSet.connect(this.signers.validators[0]).setBanThreshold(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new ban threshold", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newBanThreshold = 100;
      await validatorSet.connect(this.signers.governance).setBanThreshold(newBanThreshold);
      expect(await validatorSet.banTreshold()).to.be.equal(newBanThreshold);
    });
  });

  describe("Ban a validator by the governor", function () {
    it("should revert when not owner", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(
        validatorSet.connect(this.signers.validators[1]).banValidatorByOwner(this.signers.validators[0].address)
      ).to.be.revertedWith(ERRORS.ownable);
    });

    it("should ban the validator, even if already unstaked", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const validator = this.signers.validators[0];
      const validatorStake = await validatorSet.balanceOf(validator.address);

      // Unstake the funds right before banning a validator
      await validatorSet.connect(validator).unstake(validatorStake);

      const banTx = await validatorSet.connect(this.signers.governance).banValidatorByOwner(validator.address);

      expect((await validatorSet.validators(validator.address)).status, "status").to.be.equal(VALIDATOR_STATUS.Banned);
      await expect(banTx, "ValidatorBanned").to.emit(validatorSet, "ValidatorBanned").withArgs(validator.address);
    });

    it("should penalize a validator even if the staked amount is less than the penalty", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const validator = this.signers.validators[0];
      const validatorStake = await validatorSet.balanceOf(validator.address);

      await validatorSet.connect(this.signers.governance).banValidatorByOwner(validator.address);

      const withdrawalBalance = await validatorSet.withdrawalBalances(validator.address);
      const validatorBanPenalty = await validatorSet.validatorPenalty();

      expect(validatorBanPenalty, "validatorBanPenalty").to.be.gt(validatorStake);
      expect(withdrawalBalance.liquidTokens, "liquidTokens").to.be.equal(validatorStake);
      expect(withdrawalBalance.withdrawableAmount, "withdrawableAmount").to.be.equal(0);
    });

    it("should ban and penalize a validator successfully", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      await validatorSet.connect(this.signers.governance).setValidatorPenalty(this.minStake.div(10));

      const penalizedValidator = this.signers.validators[0];
      const stakedAmount = await validatorSet.balanceOf(penalizedValidator.address);

      const banTx = await validatorSet.connect(this.signers.governance).banValidatorByOwner(penalizedValidator.address);

      const validatorBanPenalty = await validatorSet.validatorPenalty();
      const validatorData = await validatorSet.getValidator(penalizedValidator.address);
      const withdrawalBalance = await validatorSet.withdrawalBalances(penalizedValidator.address);

      expect(validatorData.active, "active").to.be.equal(false);
      expect(await validatorSet.balanceOf(penalizedValidator.address), "balanceOf").to.be.equal(0);
      expect(withdrawalBalance.liquidTokens, "withdrawable").to.be.equal(stakedAmount);
      expect(withdrawalBalance.withdrawableAmount, "withdrawable").to.be.equal(stakedAmount.sub(validatorBanPenalty));
      await expect(banTx, "StakeChanged").to.emit(validatorSet, "StakeChanged").withArgs(penalizedValidator.address, 0);
    });

    it("should ban a validator that has a vested staking position", async function () {
      const { stakerValidatorSet, rewardPool } = await loadFixture(this.fixtures.newVestingValidatorFixture);
      await stakerValidatorSet.connect(this.signers.governance).setValidatorPenalty(this.minStake.div(10));

      const staker = this.signers.accounts[9];
      const vestingData = await rewardPool.positions(staker.address);
      const nextTimestamp = vestingData.start.add(WEEK);
      await time.setNextBlockTimestamp(nextTimestamp);

      const validatorBanPenalty = await stakerValidatorSet.validatorPenalty();
      // hardcode the penalty percent by 0.3% a week
      const bps = (VESTING_DURATION_WEEKS - 1) * 30;
      const unstakePenalty = this.minStake.mul(bps).div(DENOMINATOR);
      const stakedAmount = await stakerValidatorSet.balanceOf(staker.address);
      const stakedAmountAfterPenalty = stakedAmount.sub(unstakePenalty).sub(validatorBanPenalty);

      const banTx = await stakerValidatorSet.connect(this.signers.governance).banValidatorByOwner(staker.address);
      const withdrawalBalance = await stakerValidatorSet.withdrawalBalances(staker.address);

      await expect(banTx, "ValidatorBanned").to.emit(stakerValidatorSet, "ValidatorBanned").withArgs(staker.address);
      expect(withdrawalBalance.liquidTokens, "withdrawable").to.be.equal(stakedAmount);
      expect(withdrawalBalance.withdrawableAmount, "withdrawable").to.be.equal(stakedAmountAfterPenalty);
    });
  });

  describe("Ban a validator by public users based on a threshold", function () {
    it("should revert when the validator has never staked, still in the whitelist", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      await expect(validatorSet.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(validatorSet, "ThresholdNotReached")
        .withArgs();
    });

    it("should revert when the validator is active from less than the threshold", async function () {
      const { validatorSet, systemValidatorSet, rewardPool } = await loadFixture(
        this.fixtures.stakedValidatorsStateFixture
      );

      // Commit epochs so we will have some rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(validatorSet.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(validatorSet, "ThresholdNotReached")
        .withArgs();
    });

    it("should revert when the validator is active for long time and have not met the threshold", async function () {
      const { systemValidatorSet, rewardPool } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      // Commit epochs so we will have some rewards to be distributed
      await commitEpochs(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(systemValidatorSet.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(systemValidatorSet, "ThresholdNotReached")
        .withArgs();
    });

    it("should ban the validator, even if he succeeded to unstake before that", async function () {
      const { validatorSet, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

      const stakedAmount = await validatorSet.balanceOf(validatorToBan.address);
      await validatorSet.connect(validatorToBan).unstake(stakedAmount);

      const banTx = await validatorSet.connect(this.signers.governance).banValidator(validatorToBan.address);

      expect((await validatorSet.getValidator(validatorToBan.address)).active, "active").to.be.equal(false);
      expect(await validatorSet.balanceOf(validatorToBan.address), "balanceOf").to.be.equal(0);
      await expect(banTx, "ValidatorBanned").to.emit(validatorSet, "ValidatorBanned").withArgs(validatorToBan.address);
    });

    it("should ban and penalize the validator", async function () {
      const { validatorSet, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

      const stakedAmount = await validatorSet.balanceOf(validatorToBan.address);

      const banTx = await validatorSet.connect(this.signers.governance).banValidator(validatorToBan.address);

      const validatorBanPenalty = await validatorSet.validatorPenalty();
      const validatorData = await validatorSet.getValidator(validatorToBan.address);
      const withdrawalBalance = await validatorSet.withdrawalBalances(validatorToBan.address);

      expect(validatorData.active, "active").to.be.equal(false);
      expect(await validatorSet.balanceOf(validatorToBan.address), "balanceOf").to.be.equal(0);
      expect(withdrawalBalance.liquidTokens, "withdrawable").to.be.equal(stakedAmount);
      expect(withdrawalBalance.withdrawableAmount, "withdrawable").to.be.equal(stakedAmount.sub(validatorBanPenalty));
      await expect(banTx, "StakeChanged").to.emit(validatorSet, "StakeChanged").withArgs(validatorToBan.address, 0);
    });
  });

  describe("Withdraw banned funds", function () {
    it("should revert when trying to withdraw from non banned validator", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.bannedValidatorFixture);

      await expect(validatorSet.connect(this.signers.validators[2]).withdrawBannedFunds())
        .to.be.revertedWithCustomError(validatorSet, "Unauthorized")
        .withArgs("UNBANNED_VALIDATOR");
    });

    it("should fail the withdrawal when there are no funds in the validator set", async function () {
      const { validatorSet, bannedValidator } = await loadFixture(this.fixtures.bannedValidatorFixture);

      // clear the contract's balance in order to force withdrawal fail
      setBalance(validatorSet.address, 0);
      await expect(validatorSet.connect(bannedValidator).withdrawBannedFunds()).to.be.revertedWith("WITHDRAWAL_FAILED");
    });

    it("should successfully withdraw the funds", async function () {
      const { validatorSet, liquidToken, bannedValidator, stakedAmount } = await loadFixture(
        this.fixtures.bannedValidatorFixture
      );

      const validatorBanPenalty = await validatorSet.validatorPenalty();
      const withdrawAmount = stakedAmount.sub(validatorBanPenalty);
      const withdrawTx = await validatorSet.connect(bannedValidator).withdrawBannedFunds();

      await expect(withdrawTx, "emit Transfer")
        .to.emit(liquidToken, "Transfer")
        .withArgs(bannedValidator.address, ethers.constants.AddressZero, stakedAmount);
      expect(await liquidToken.balanceOf(bannedValidator.address), "lydra balanceOf").to.be.equal(0);
      await expect(withdrawTx, "emit WithdrawalFinished")
        .to.emit(validatorSet, "WithdrawalFinished")
        .withArgs(validatorSet.address, bannedValidator.address, withdrawAmount);
      await expect(withdrawTx, "change balances").to.changeEtherBalances(
        [validatorSet.address, bannedValidator.address],
        [withdrawAmount.mul(-1), withdrawAmount]
      );

      const withdrawalBalance = await validatorSet.withdrawalBalances(bannedValidator.address);
      expect(withdrawalBalance.liquidTokens, "withdrawalBalance.liquidTokens").to.be.equal(0);
      expect(withdrawalBalance.withdrawableAmount, "withdrawalBalance.withdrawableAmount").to.be.equal(0);
    });
  });
}
