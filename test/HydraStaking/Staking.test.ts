/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ERRORS } from "../constants";

export function RunStakingTests(): void {
  describe("Stake", function () {
    it("should allow only registered validators to stake", async function () {
      // * Only the first three validators are being registered
      const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

      await expect(hydraStaking.connect(this.signers.validators[3]).stake({ value: this.minStake }))
        .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
        .withArgs(ERRORS.mustBeRegistered);
    });

    it("should revert if min amount not reached", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

      await expect(hydraStaking.connect(this.signers.validators[0]).stake({ value: this.minStake.div(2) }))
        .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
        .withArgs("stake", "STAKE_TOO_LOW");
    });

    it("should be able to stake", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);
      const validator = this.signers.validators[0];
      const tx = await hydraStaking.connect(validator).stake({ value: this.minStake });

      await expect(tx, "Staked emitted").to.emit(hydraStaking, "Staked").withArgs(validator.address, this.minStake);
      expect(await hydraStaking.stakeOf(validator.address), "staked amount").to.equal(this.minStake);
      expect(await hydraStaking.totalBalanceOf(validator.address), "total balance (stake + delegated)").to.equal(
        this.minStake
      );
    });

    it("should allow fully-unstaked validator to stake again", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);
      const validator = this.signers.validators[0];
      const validatorHydraStaking = hydraStaking.connect(validator);

      await validatorHydraStaking.stake({ value: this.minStake });
      expect(await hydraStaking.stakeOf(validator.address)).to.equal(this.minStake);

      await validatorHydraStaking.unstake(this.minStake);
      expect(await hydraStaking.stakeOf(validator.address)).to.equal(0);

      await expect(validatorHydraStaking.stake({ value: this.minStake })).to.not.be.reverted;
    });
  });

  describe("Unstake", function () {
    it("should not be able to unstake if there is insufficient staked balance", async function () {
      const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      const validator = this.signers.validators[0];
      const unstakeInsufficientAmount = this.minStake.mul(2).add(1);

      // Send more liquid tokens to the validator so he has enough to make the unstake
      await liquidToken.connect(this.signers.validators[1]).transfer(validator.address, 1);

      await expect(hydraStaking.connect(validator).unstake(unstakeInsufficientAmount))
        .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
        .withArgs("unstake", "INSUFFICIENT_BALANCE");
    });

    it("should not be able to exploit int overflow", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraStaking.connect(this.signers.validators[0]).unstake(hre.ethers.constants.MaxInt256.add(1))).to
        .be.reverted;
    });

    it("should not be able to unstake so that less than minStake is left", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      const amountToUnstake = this.minStake.add(hre.ethers.utils.parseEther("0.2"));

      await expect(hydraStaking.unstake(amountToUnstake))
        .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
        .withArgs("unstake", "STAKE_TOO_LOW");
    });

    it("should revert with insufficient balance when trying to unstake from the delegation pool", async function () {
      const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.delegatedFixture);
      const validator = this.signers.validators[0];
      const totalValidatorBalance = await hydraStaking.totalBalanceOf(validator.address);
      const unstakeAmount = totalValidatorBalance.sub(this.minStake);

      // Send more liquid tokens to the validator so he has enough to make the unstake
      await liquidToken.connect(this.signers.validators[1]).transfer(validator.address, this.minStake.mul(2));

      await expect(hydraStaking.connect(validator).unstake(unstakeAmount))
        .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
        .withArgs("unstake", "INSUFFICIENT_BALANCE");
    });

    it("should be able to partially unstake", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      const validator = this.signers.validators[0];

      const amountToUnstake = hre.ethers.utils.parseEther("0.2");
      const tx = await hydraStaking.connect(validator).unstake(amountToUnstake);
      await expect(tx).to.emit(hydraStaking, "Unstaked").withArgs(validator.address, amountToUnstake);
    });

    it("should take pending unstakes into account", async function () {
      const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      const validator = this.signers.validators[0];
      const validatorHydraStaking = hydraStaking.connect(validator);

      const amountToUnstake = this.minStake.div(2);
      const amountLeft = this.minStake.mul(2).sub(amountToUnstake);

      await validatorHydraStaking.unstake(amountToUnstake);

      // Send more liquid tokens to the validator so he has enough to make the unstake
      await liquidToken.connect(this.signers.validators[1]).transfer(validator.address, this.minStake.mul(2));

      await expect(validatorHydraStaking.unstake(amountLeft.add(1)))
        .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
        .withArgs("unstake", "INSUFFICIENT_BALANCE");
    });

    it("should be able to completely unstake", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      const validator = this.signers.validators[0];

      const tx = hydraStaking.connect(validator).unstake(this.minStake.mul(2));
      await expect(tx).to.emit(hydraStaking, "Unstaked").withArgs(validator.address, this.minStake.mul(2));
    });

    it("should place in withdrawal queue", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      const validator = this.signers.validators[0];

      await hydraStaking.connect(validator).unstake(this.minStake.mul(2));

      expect(await hydraStaking.pendingWithdrawals(validator.address)).to.equal(this.minStake.mul(2));
      expect(await hydraStaking.withdrawable(validator.address)).to.equal(0);
    });
  });
}
