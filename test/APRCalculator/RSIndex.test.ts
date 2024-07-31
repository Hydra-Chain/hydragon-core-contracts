/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ERRORS, INITIAL_PRICE, MIN_RSI_BONUS } from "../constants";

export function RunRSIndexTests(): void {
  it("should get RSI", async function () {
    const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    expect(await aprCalculator.getRSIBonus()).to.equal(0);
  });
  describe("Set RSIndex", function () {});

  describe("Gard RSIndex", function () {
    it("should revert if not called by governance", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      const adminRole = await aprCalculator.DEFAULT_ADMIN_ROLE();

      await expect(aprCalculator.gardRSIndex()).to.be.revertedWith(
        ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), adminRole)
      );
    });

    it("should successfully gard RSI & disable updates", async function () {
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
      expect(currentMacroFactor).to.equal(MIN_RSI_BONUS);
      expect(currentMacroFactor).to.below(oldMacroFactor);
      expect(await aprCalculator.disabledMacro()).to.be.true;
      expect(await aprCalculator.smaSlowSum()).to.equal(oldSMASlowSum);
      expect(await aprCalculator.smaFastSum()).to.equal(oldSMAFastSum);
    });

    it("should disable gard and enable RSI updates after calling the function again", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.fullSmaSlowSumMacroFactorFixture);

      await aprCalculator.connect(this.signers.governance).gardMacroFactor();
      expect(await aprCalculator.disabledMacro()).to.be.true;
      expect(await aprCalculator.macroFactor()).to.be.equal(MIN_RSI_BONUS);

      await aprCalculator.connect(this.signers.governance).gardMacroFactor();
      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.emit(
        aprCalculator,
        "MacroFactorSet"
      );
      expect(await aprCalculator.disabledMacro()).to.be.false;
      expect(await aprCalculator.macroFactor()).to.be.above(MIN_RSI_BONUS);
    });
  });
}
