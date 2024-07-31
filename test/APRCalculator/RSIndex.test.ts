/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { DAY, INITIAL_PRICE, MAX_RSI_BONUS } from "../constants";
import { commitEpoch } from "../helper";

export function RunRSIndexTests(): void {
  it("should get RSI", async function () {
    const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    expect(await aprCalculator.getRSIBonus()).to.equal(0);
  });
  describe("Set RSIndex", function () {
    it("should not update RSI on price update if we do not have the data for more than 2 weeks", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.commitEpochTxFixture);

      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE * 2)).to.not.emit(
        aprCalculator,
        "RSIBonusSet"
      );

      expect(await aprCalculator.averageGain()).to.equal(0);
      expect(await aprCalculator.averageLoss()).to.equal(0);
      expect(await aprCalculator.getRSIBonus()).to.equal(0);
    });

    it("should update RSI on price update after 14 updates on price on oversold condition", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.rsiOverSoldConditionFixture);

      expect(await aprCalculator.rsi()).to.be.equal(MAX_RSI_BONUS);
    });

    it("should update RSI on price update on overbought condition", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.rsiOverSoldConditionFixture
      );

      for (let i = 0; i <= 15; i++) {
        await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE + i * 30));
        await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
      }

      expect(await aprCalculator.rsi()).to.be.equal(0);
    });

    it("should emit event on RSI update", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.rsiOverSoldConditionFixture);

      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE))
        .to.emit(aprCalculator, "RSIBonusSet")
        .withArgs(MAX_RSI_BONUS);
    });

    it("should properly update average gain or loss", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.rsiOverSoldConditionFixture
      );

      const averageGain = await aprCalculator.averageGain();
      const averageLoss = await aprCalculator.averageLoss();

      // quote price 5 times to update the average gain and loss and then quote again to update the price
      await aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE * 5);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
      await aprCalculator.connect(this.signers.system).quotePrice(1);

      expect(await aprCalculator.averageGain()).to.be.above(averageGain);
      expect(await aprCalculator.averageLoss()).to.be.below(averageLoss);

      // quote price again to update the price we set to 0 and see if the average gain and loss are updated properly
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
      await aprCalculator.connect(this.signers.system).quotePrice(1);

      expect(await aprCalculator.averageGain()).to.be.below(averageGain);
      expect(await aprCalculator.averageLoss()).to.be.above(averageLoss);
    });
  });

  // describe("Gard RSIndex", function () {
  //   it("should revert if not called by governance", async function () {
  //     const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

  //     const adminRole = await aprCalculator.DEFAULT_ADMIN_ROLE();

  //     await expect(aprCalculator.gardRSIndex()).to.be.revertedWith(
  //       ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), adminRole)
  //     );
  //   });

  //   it("should successfully gard RSI & disable updates", async function () {
  //     const { aprCalculator } = await loadFixture(this.fixtures.fullSmaSlowSumMacroFactorFixture);
  //     const oldMacroFactor = await aprCalculator.getMacroFactor();
  //     const oldSMASlowSum = await aprCalculator.smaSlowSum();
  //     const oldSMAFastSum = await aprCalculator.smaFastSum();
  //     await aprCalculator.connect(this.signers.governance).gardMacroFactor();

  //     await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.not.emit(
  //       aprCalculator,
  //       "MacroFactorSet"
  //     );
  //     const currentMacroFactor = await aprCalculator.getMacroFactor();
  //     expect(currentMacroFactor).to.equal(MIN_RSI_BONUS);
  //     expect(currentMacroFactor).to.below(oldMacroFactor);
  //     expect(await aprCalculator.disabledMacro()).to.be.true;
  //     expect(await aprCalculator.smaSlowSum()).to.equal(oldSMASlowSum);
  //     expect(await aprCalculator.smaFastSum()).to.equal(oldSMAFastSum);
  //   });

  //   it("should disable gard and enable RSI updates after calling the function again", async function () {
  //     const { aprCalculator } = await loadFixture(this.fixtures.fullSmaSlowSumMacroFactorFixture);

  //     await aprCalculator.connect(this.signers.governance).gardMacroFactor();
  //     expect(await aprCalculator.disabledMacro()).to.be.true;
  //     expect(await aprCalculator.macroFactor()).to.be.equal(MIN_RSI_BONUS);

  //     await aprCalculator.connect(this.signers.governance).gardMacroFactor();
  //     await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.emit(
  //       aprCalculator,
  //       "MacroFactorSet"
  //     );
  //     expect(await aprCalculator.disabledMacro()).to.be.false;
  //     expect(await aprCalculator.macroFactor()).to.be.above(MIN_RSI_BONUS);
  //   });
  // });
}
