/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { DAY, ERRORS, INITIAL_MACRO_FACTOR, INITIAL_PRICE } from "../constants";
import { commitEpoch } from "../helper";

export function RunMacroFactorTests(): void {
  it("should get macro factor", async function () {
    const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    expect(await aprCalculator.getMacroFactor()).to.equal(INITIAL_MACRO_FACTOR);
  });

  describe("Set Macro Factor", function () {
    it("should update macro factor on price update", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      await aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE * 2);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      // need to quote price again to update the price we already quoted
      expect(await aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE))
        .to.emit(aprCalculator, "MacroFactorSet")
        .withArgs(INITIAL_MACRO_FACTOR);

      expect(await aprCalculator.smaFastSum(), "SMA Fast Sum").to.equal(INITIAL_PRICE * 2);
      expect(await aprCalculator.smaSlowSum(), "SMA Slow Sum").to.equal(INITIAL_PRICE * 2);
      expect(await aprCalculator.updatedPrices([0]), "updated prices array").to.equal(INITIAL_PRICE * 2);
      expect(await aprCalculator.getMacroFactor()).to.equal(INITIAL_MACRO_FACTOR);
    });

    it("should update macro factor on price update on different SMA", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.fullSmaSlowSumMacroFactorFixture);

      expect(await aprCalculator.updatedPrices([230]), "updated prices array").to.above(INITIAL_PRICE);
      expect(await aprCalculator.getMacroFactor()).to.above(INITIAL_MACRO_FACTOR);
    });

    it("should update properly change SMA sum on price update", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.fullSmaSlowSumMacroFactorFixture
      );

      await aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      const smaFastSum = await aprCalculator.smaFastSum();
      const smaSlowSum = await aprCalculator.smaSlowSum();
      // need to quote price again to update the price we already quoted above
      await aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE * 3);

      expect(await aprCalculator.smaFastSum(), "SMA Fast Sum").to.below(smaFastSum);
      expect(await aprCalculator.smaSlowSum(), "SMA Slow Sum").to.below(smaSlowSum);
    });
  });

  describe("Gard Macro Factor", function () {
    it("should revert if not called by governance", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      const managerRole = await aprCalculator.MANAGER_ROLE();

      await expect(aprCalculator.gardMacroFactor()).to.be.revertedWith(
        ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
      );
    });

    it("should successfully gard macro factor & disable updates", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.fullSmaSlowSumMacroFactorFixture);
      const oldMacroFactor = await aprCalculator.getMacroFactor();
      const oldSMASlowSum = await aprCalculator.smaSlowSum();
      const oldSMAFastSum = await aprCalculator.smaFastSum();
      await aprCalculator.connect(this.signers.governance).gardMacroFactor();

      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.not.emit(
        aprCalculator,
        "MacroFactorSet"
      );
      const currentMacroFactor = await aprCalculator.getMacroFactor();
      expect(currentMacroFactor).to.equal(INITIAL_MACRO_FACTOR);
      expect(currentMacroFactor).to.below(oldMacroFactor);
      expect(await aprCalculator.disabledMacro()).to.be.true;
      expect(await aprCalculator.smaSlowSum()).to.equal(oldSMASlowSum);
      expect(await aprCalculator.smaFastSum()).to.equal(oldSMAFastSum);
    });

    it("should disable gard and enable macro factor updates after calling the function again", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.fullSmaSlowSumMacroFactorFixture);

      await aprCalculator.connect(this.signers.governance).gardMacroFactor();
      expect(await aprCalculator.disabledMacro()).to.be.true;
      expect(await aprCalculator.macroFactor()).to.be.equal(INITIAL_MACRO_FACTOR);

      await aprCalculator.connect(this.signers.governance).gardMacroFactor();
      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.emit(
        aprCalculator,
        "MacroFactorSet"
      );
      expect(await aprCalculator.disabledMacro()).to.be.false;
      expect(await aprCalculator.macroFactor()).to.be.above(INITIAL_MACRO_FACTOR);
    });
  });
}
