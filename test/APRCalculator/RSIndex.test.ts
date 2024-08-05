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

      const averageGainAfter = await aprCalculator.averageGain();
      expect(averageGainAfter).to.be.above(averageGain);
      expect(await aprCalculator.averageLoss()).to.be.below(averageLoss);

      // quote price again to update the price we set to 0 and see if the average gain and loss are updated properly
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
      await aprCalculator.connect(this.signers.system).quotePrice(1);

      expect(await aprCalculator.averageGain()).to.be.below(averageGainAfter);
      expect(await aprCalculator.averageLoss()).to.be.above(averageLoss);
    });

    it.skip("should properly update RSI on slowly moving the price", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.rsiOverSoldConditionFixture
      );
      expect(await aprCalculator.rsi()).to.be.equal(MAX_RSI_BONUS);
      const currentPrice = await aprCalculator.latestDailyPrice();
      console.log("currentPrice", currentPrice);

      await aprCalculator.connect(this.signers.system).quotePrice(currentPrice.add(100));
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      await aprCalculator.connect(this.signers.system).quotePrice(currentPrice.add(100));
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      await aprCalculator.connect(this.signers.system).quotePrice(currentPrice.add(100));
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      await aprCalculator.connect(this.signers.system).quotePrice(currentPrice.add(1000));
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      await aprCalculator.connect(this.signers.system).quotePrice(currentPrice.add(10));
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      await aprCalculator.connect(this.signers.system).quotePrice(currentPrice.add(10));
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      expect(await aprCalculator.rsi()).to.be.equal(0);
    });
  });

  describe("Gard RSIndex", function () {
    it("should successfully gard RSI & disable updates", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.rsiOverSoldConditionFixture);
      const oldRSI = await aprCalculator.getRSIBonus();
      await expect(aprCalculator.connect(this.signers.governance).guardBonuses())
        .to.emit(aprCalculator, "RSIBonusSet")
        .withArgs(0);
      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.not.emit(
        aprCalculator,
        "RSIBonusSet"
      );
      const currentRSI = await aprCalculator.getRSIBonus();
      expect(currentRSI).to.equal(0);
      expect(currentRSI).to.below(oldRSI);
      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;
    });

    it("should disable gard and enable RSI updates after calling the function again", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.rsiOverSoldConditionFixture
      );
      await aprCalculator.connect(this.signers.governance).guardBonuses();

      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.not.emit(
        aprCalculator,
        "RSIBonusSet"
      );
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;

      await aprCalculator.connect(this.signers.governance).disableGuard();

      expect(await aprCalculator.disabledBonusesUpdates()).to.be.false;

      await expect(aprCalculator.connect(this.signers.system).quotePrice(INITIAL_PRICE / 2)).to.emit(
        aprCalculator,
        "RSIBonusSet"
      );
    });
  });
}
