/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import { expect } from "chai";
import { loadFixture, setBalance, time } from "@nomicfoundation/hardhat-network-helpers";
import { ERRORS, WEEK } from "../constants";

export function RunWithdrawalTests(): void {
  describe("", function () {
    it("should fail the withdrawal", async function () {
      const { hydraChain, unstakedValidator, hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

      const validator = await hydraChain.getValidator(unstakedValidator.address);
      const balanceAfterUnstake = this.minStake.mul(2).sub(this.minStake.div(2));
      expect(validator.stake, "validator stake").to.equal(balanceAfterUnstake);

      await setBalance(hydraStaking.address, 0);
      const balance = await hre.ethers.provider.getBalance(hydraStaking.address);
      expect(balance, "hydraStaking balance").to.equal(0);

      await expect(
        hydraStaking.connect(unstakedValidator).withdraw(unstakedValidator.address)
      ).to.be.revertedWithCustomError(hydraStaking, "WithdrawalFailed");
    });

    it("should fail the withdrawal before withdraw time passes", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(
        hydraStaking.connect(this.signers.validators[0]).withdraw(this.signers.validators[0].address)
      ).to.be.revertedWithCustomError(hydraStaking, "NoWithdrawalAvailable");
    });

    it("should give the right amount on view function with multiple stake", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

      // unstake second time same amount
      await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake.div(2));

      const withdrawable = await hydraStaking.withdrawable(this.signers.validators[0].address);
      const pending = await hydraStaking.pendingWithdrawals(this.signers.validators[0].address);

      expect(withdrawable).to.equal(this.minStake.div(2)).and.to.equal(pending);

      // increase time to pass the withdraw time for 2nd stake
      await time.increase(WEEK);

      const withdrawableAfter = await hydraStaking.withdrawable(this.signers.validators[0].address);
      const pendingAfter = await hydraStaking.pendingWithdrawals(this.signers.validators[0].address);

      expect(withdrawableAfter).to.equal(this.minStake);
      expect(pendingAfter).to.equal(0);

      // withdraw
      await expect(
        hydraStaking.connect(this.signers.validators[0]).withdraw(this.signers.validators[0].address)
      ).to.emit(hydraStaking, "WithdrawalFinished");

      const withdrawableAfterWithdraw = await hydraStaking.withdrawable(this.signers.validators[0].address);
      const pendingAfterWithdraw = await hydraStaking.pendingWithdrawals(this.signers.validators[0].address);

      expect(withdrawableAfterWithdraw).to.equal(0).and.to.equal(pendingAfterWithdraw);
    });

    it("should withdraw", async function () {
      const { unstakedValidator, unstakedAmount, hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

      expect(await hydraStaking.connect(unstakedValidator).withdraw(unstakedValidator.address), "withdraw")
        .to.emit(hydraStaking, "WithdrawalFinished")
        .withArgs(hydraStaking.address, unstakedValidator.address, unstakedAmount);
      expect(await hydraStaking.pendingWithdrawals(unstakedValidator.address), "pendingWithdrawals").to.equal(0);
      expect(await hydraStaking.withdrawable(unstakedValidator.address), "withdrawable").to.equal(0);
    });

    it("should fail to update withdraw time if not governance", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(hydraStaking.connect(this.signers.validators[0]).changeWithdrawalWaitPeriod(WEEK * 2))
        .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.governanceArg);
    });

    it("should fail update withdraw time if we pass 0", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(
        hydraStaking.connect(this.signers.governance).changeWithdrawalWaitPeriod(0)
      ).to.be.revertedWithCustomError(hydraStaking, "InvalidWaitPeriod");
    });

    it("should update withdraw time by governance account", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

      await hydraStaking.connect(this.signers.governance).changeWithdrawalWaitPeriod(WEEK * 2);
      const waitPeriod = await hydraStaking.withdrawWaitPeriod();
      expect(waitPeriod).to.be.equal(WEEK * 2);
    });
  });
}
