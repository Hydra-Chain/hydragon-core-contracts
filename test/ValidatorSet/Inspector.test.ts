/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";

import { expect } from "chai";
import { DENOMINATOR, VALIDATOR_STATUS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
import { registerValidator } from "../helper";

export function RunInspectorTests(): void {
  describe("Ban a validator", function () {
    it("should revert if try to ban zero address", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(
        validatorSet.connect(this.signers.governance).banValidator(hre.ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(validatorSet, "ZeroAddress");
    });

    it("should revert when the validator is not registered", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      await expect(validatorSet.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(validatorSet, "Unauthorized")
        .withArgs("UNREGISTERED_VALIDATOR");
    });

    it("should ban a validator successfully", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const penalizedValidator = this.signers.validators[0];
      const stakedAmount = await validatorSet.balanceOf(penalizedValidator.address);

      await validatorSet.connect(this.signers.governance).banValidator(this.signers.validators[0].address);

      const validatorBanPenalty = await validatorSet.validatorPenalty();
      const validatorData = await validatorSet.getValidator(penalizedValidator.address);

      expect((await validatorSet.validators(penalizedValidator.address)).status, "status").to.be.equal(
        VALIDATOR_STATUS.Banned
      );
      expect(validatorData.active, "active").to.be.equal(false);
      expect(await validatorSet.balanceOf(penalizedValidator.address), "balanceOf").to.be.equal(0);
      expect(await validatorSet.pendingWithdrawals(penalizedValidator.address), "withdrawals").to.be.equal(
        stakedAmount.sub(validatorBanPenalty)
      );
    });

    it("should ban a validator that has a vested staking position", async function () {
      const { validatorSet, rewardPool } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newValidator = this.signers.accounts[9];

      await registerValidator(validatorSet, this.signers.governance, newValidator);

      const stakerValidatorSet = validatorSet.connect(newValidator);
      await stakerValidatorSet.stakeWithVesting(VESTING_DURATION_WEEKS, {
        value: this.minStake,
      });

      const vestingData = await rewardPool.positions(newValidator.address);
      const nextTimestamp = vestingData.start.add(WEEK);
      await time.setNextBlockTimestamp(nextTimestamp);

      const validatorBanPenalty = await validatorSet.validatorPenalty();
      const amountAfterBanPenalty = this.minStake.sub(validatorBanPenalty);
      // hardcode the penalty percent by 0.3% a week
      const bps = (VESTING_DURATION_WEEKS - 1) * 30;
      const unstakePenalty = amountAfterBanPenalty.mul(bps).div(DENOMINATOR);
      const stakedAmount = await validatorSet.balanceOf(newValidator.address);

      const banTx = await validatorSet.connect(this.signers.governance).banValidator(newValidator.address);

      await expect(banTx, "Unstaked")
        .to.emit(validatorSet, "Unstaked")
        .withArgs(newValidator.address, stakedAmount.sub(validatorBanPenalty));
      await expect(banTx, "ValidatorBanned").to.emit(validatorSet, "ValidatorBanned").withArgs(newValidator.address);
      expect(await validatorSet.pendingWithdrawals(newValidator.address), "withdrawals").to.be.equal(
        stakedAmount.sub(validatorBanPenalty).sub(unstakePenalty)
      );
    });
  });
}
