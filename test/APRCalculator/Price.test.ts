/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { ERRORS, INITIAL_PRICES_TO_REACH_BONUSES } from "../constants";
import { getCurrentDay } from "../helper";

export function RunPriceTests(): void {
  describe("updatePrice", function () {
    it("should revert if not called by Price Oracle", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(aprCalculator.connect(this.signers.system).updatePrice(111, 1))
        .to.be.revertedWithCustomError(aprCalculator, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.priceOracleArg);
    });

    it("should revert if Price Oracle gives 0", async function () {
      const { aprCalculator, hydraChain } = await loadFixture(this.fixtures.presetHydraChainStateFixture);
      // Initialize APR Calculator and set governance as price oracle
      await aprCalculator
        .connect(this.signers.system)
        .initialize(
          this.signers.governance.address,
          hydraChain.address,
          this.signers.governance.address,
          INITIAL_PRICES_TO_REACH_BONUSES
        );

      await expect(aprCalculator.connect(this.signers.governance).updatePrice(0, 1152)).to.be.reverted;
    });

    it("should revert if Price Oracle gives a day that already have a price", async function () {
      const { aprCalculator, hydraChain } = await loadFixture(this.fixtures.presetHydraChainStateFixture);
      // Initialize APR Calculator and set governance as price oracle
      await aprCalculator
        .connect(this.signers.system)
        .initialize(
          this.signers.governance.address,
          hydraChain.address,
          this.signers.governance.address,
          INITIAL_PRICES_TO_REACH_BONUSES
        );

      await expect(aprCalculator.connect(this.signers.governance).updatePrice(4, 1)).to.not.be.reverted;
      expect(await aprCalculator.pricePerDay(1)).to.not.equal(0);
      await expect(aprCalculator.connect(this.signers.governance).updatePrice(4, 1)).to.be.reverted;
    });

    it("should update price correctly", async function () {
      const { aprCalculator, priceOracle, priceToVote, validatorToVote } = await loadFixture(
        this.fixtures.votedValidatorsStateFixture
      );

      const currentDay = await getCurrentDay();

      await expect(priceOracle.connect(validatorToVote).vote(priceToVote))
        .to.emit(aprCalculator, "PriceUpdated")
        .withArgs(currentDay, priceToVote);

      expect(await aprCalculator.latestDailyPrice(), "latestDailyPrice").to.equal(priceToVote);
      expect(await aprCalculator.pricePerDay(currentDay), "pricePerDay").to.equal(priceToVote);
    });
  });

  describe("Guard Bonuses", function () {
    it("should revert guardBonuses if not called by governance", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(aprCalculator.connect(this.signers.system).guardBonuses()).to.be.revertedWith(
        ERRORS.accessControl(this.signers.system.address, await aprCalculator.DEFAULT_ADMIN_ROLE())
      );
    });

    it("should revert guardBonuses if already guarded", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await aprCalculator.connect(this.signers.governance).guardBonuses();

      await expect(aprCalculator.connect(this.signers.governance).guardBonuses()).to.be.revertedWithCustomError(
        aprCalculator,
        "GuardAlreadyEnabled"
      );
    });

    it("should guard bonuses", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await aprCalculator.connect(this.signers.governance).guardBonuses();

      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;
    });

    it("should revert guard disable if not called by governance", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(aprCalculator.connect(this.signers.accounts[4]).disableGuard()).to.be.revertedWith(
        ERRORS.accessControl(this.signers.accounts[4].address, await aprCalculator.DEFAULT_ADMIN_ROLE())
      );
    });

    it("should revert guard disable if not guarded", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(aprCalculator.connect(this.signers.governance).disableGuard()).to.be.revertedWithCustomError(
        aprCalculator,
        "GuardAlreadyDisabled"
      );
    });

    it("should disable guard", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await aprCalculator.connect(this.signers.governance).guardBonuses();
      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;
      await aprCalculator.connect(this.signers.governance).disableGuard();
      expect(await aprCalculator.disabledBonusesUpdates()).to.be.false;
    });
  });
}
