/* eslint-disable node/no-extraneous-import */
import { loadFixture, time, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { DENOMINATOR, VALIDATOR_STATUS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
import { ethers } from "hardhat";

export function RunInspectorTests(): void {
  describe("Ban a validator", function () {
    it("should revert when the validator is not registered", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      await expect(validatorSet.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(validatorSet, "Unauthorized")
        .withArgs("UNREGISTERED_VALIDATOR");
    });

    it("should only ban the validator, if already unstaked", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const validator = this.signers.validators[0];
      const validatorStake = await validatorSet.balanceOf(validator.address);

      // Unstake the funds right before banning a validator
      await validatorSet.connect(validator).unstake(validatorStake);

      const banTx = await validatorSet.connect(this.signers.governance).banValidator(validator.address);

      expect((await validatorSet.validators(validator.address)).status, "status").to.be.equal(VALIDATOR_STATUS.Banned);
      await expect(banTx, "ValidatorBanned").to.emit(validatorSet, "ValidatorBanned").withArgs(validator.address);
    });

    it("should penalize a validator even if the staked amount is less than the penalty", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const validator = this.signers.validators[0];
      const validatorStake = await validatorSet.balanceOf(validator.address);

      await validatorSet.connect(this.signers.governance).banValidator(validator.address);

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

      const banTx = await validatorSet.connect(this.signers.governance).banValidator(penalizedValidator.address);

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

      const banTx = await stakerValidatorSet.connect(this.signers.governance).banValidator(staker.address);
      const withdrawalBalance = await stakerValidatorSet.withdrawalBalances(staker.address);

      await expect(banTx, "ValidatorBanned").to.emit(stakerValidatorSet, "ValidatorBanned").withArgs(staker.address);
      expect(withdrawalBalance.liquidTokens, "withdrawable").to.be.equal(stakedAmount);
      expect(withdrawalBalance.withdrawableAmount, "withdrawable").to.be.equal(stakedAmountAfterPenalty);
    });
  });

  describe("Withdraw banned funds", function () {
    it("should revert when trying to withdraw from non banned validator", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.bannedValidatorFixture);

      await expect(validatorSet.connect(this.signers.validators[2]).withdrawBannedFunds())
        .to.be.revertedWithCustomError(validatorSet, "Unauthorized")
        .withArgs("BANNED_VALIDATOR");
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
