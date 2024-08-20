/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ERRORS, INITIAL_DEFAULT_MACRO_FACTOR, MAX_MACRO_FACTOR, MIN_MACRO_FACTOR } from "../constants";

export function RunMacroFactorTests(): void {
  it("should get macro factor", async function () {
    const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    expect(await aprCalculator.getMacroFactor())
      .to.least(MIN_MACRO_FACTOR)
      .and.to.be.most(MAX_MACRO_FACTOR);
  });

  describe("Set Macro Factor", function () {
    it("should emit MacroFactorSet event on price update", async function () {
      const { aprCalculator, priceOracle, priceToVote, validatorToVote } = await loadFixture(
        this.fixtures.votedValidatorsStateFixture
      );

      await expect(priceOracle.connect(validatorToVote).vote(priceToVote)).to.emit(aprCalculator, "MacroFactorSet");
    });

    it("should update properly change SMA sum on price update", async function () {
      const { aprCalculator, priceToVote, priceOracle, validatorToVote } = await loadFixture(
        this.fixtures.votedValidatorsStateFixture
      );

      const smaFastSum = await aprCalculator.smaFastSum();
      const smaSlowSum = await aprCalculator.smaSlowSum();
      await priceOracle.connect(validatorToVote).vote(priceToVote);

      expect(await aprCalculator.smaFastSum(), "SMA Fast Sum").to.above(smaFastSum);
      expect(await aprCalculator.smaSlowSum(), "SMA Slow Sum").to.above(smaSlowSum);
    });
  });

  describe("Guard Macro Factor", function () {
    it("should successfully guard macro factor & disable updates", async function () {
      const { aprCalculator, priceOracle, priceToVote, validatorToVote } = await loadFixture(
        this.fixtures.votedValidatorsStateFixture
      );
      const oldSMASlowSum = await aprCalculator.smaSlowSum();
      const oldSMAFastSum = await aprCalculator.smaFastSum();

      await expect(aprCalculator.connect(this.signers.governance).guardBonuses())
        .to.emit(aprCalculator, "MacroFactorSet")
        .withArgs(INITIAL_DEFAULT_MACRO_FACTOR);

      await expect(priceOracle.connect(validatorToVote).vote(priceToVote)).to.not.emit(aprCalculator, "MacroFactorSet");
      const currentMacroFactor = await aprCalculator.getMacroFactor();
      expect(currentMacroFactor).to.equal(INITIAL_DEFAULT_MACRO_FACTOR);
      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;
      expect(await aprCalculator.smaSlowSum()).to.equal(oldSMASlowSum);
      expect(await aprCalculator.smaFastSum()).to.equal(oldSMAFastSum);
    });

    it("should disable guard and enable macro factor updates", async function () {
      const { aprCalculator, priceOracle, priceToVote, validatorToVote } = await loadFixture(
        this.fixtures.votedValidatorsStateFixture
      );

      await aprCalculator.connect(this.signers.governance).guardBonuses();
      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;
      expect(await aprCalculator.macroFactor()).to.be.equal(INITIAL_DEFAULT_MACRO_FACTOR);

      await aprCalculator.connect(this.signers.governance).disableGuard();
      expect(await aprCalculator.disabledBonusesUpdates()).to.be.false;

      await expect(priceOracle.connect(validatorToVote).vote(priceToVote)).to.emit(aprCalculator, "MacroFactorSet");
    });
  });

  describe("Change default macro factor", function () {
    it("should revert if not called by governance", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      const managerRole = await aprCalculator.MANAGER_ROLE();

      await expect(aprCalculator.changeDefaultMacroFactor(10)).to.be.revertedWith(
        ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
      );
    });

    it("should revert if new default macro factor is not between min and max macro factor", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(
        aprCalculator.connect(this.signers.governance).changeDefaultMacroFactor(MIN_MACRO_FACTOR.sub(1))
      ).to.be.revertedWithCustomError(aprCalculator, "InvalidMacroFactor");

      await expect(
        aprCalculator.connect(this.signers.governance).changeDefaultMacroFactor(MAX_MACRO_FACTOR.add(1))
      ).to.be.revertedWithCustomError(aprCalculator, "InvalidMacroFactor");
    });

    it("should successfully change default macro factor", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(aprCalculator.connect(this.signers.governance).changeDefaultMacroFactor(MIN_MACRO_FACTOR))
        .to.emit(aprCalculator, "DefaultMacroFactorChanged")
        .withArgs(MIN_MACRO_FACTOR);

      expect(await aprCalculator.defaultMacroFactor()).to.equal(MIN_MACRO_FACTOR);
    });
  });
}
