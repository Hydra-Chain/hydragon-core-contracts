/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  DAY,
  INITIAL_PRICE,
  INITIAL_DATA_PRICES,
  MAX_RSI_BONUS,
  SLOW_SMA,
  TABLE_DATA_PRICES,
  TABLE_DATA_RSI,
} from "../constants";
import { calculateRSIBonus, commitEpoch, getCorrectVotingTimestamp } from "../helper";
import { ethers } from "hardhat";

export function RunRSIndexTests(): void {
  it("should get RSI", async function () {
    const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    expect(await aprCalculator.getRSIBonus())
      .to.be.least(0)
      .and.to.be.most(MAX_RSI_BONUS);
  });
  describe("Set RSIndex", function () {
    it("should update RSI bonus on price update after 14 updates on price on oversold condition", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.rsiOverSoldConditionFixture);

      expect(await aprCalculator.rsi()).to.be.above(0);
    });

    it("should update RSI on price update on overbought condition", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking, priceOracle } = await loadFixture(
        this.fixtures.rsiOverSoldConditionFixture
      );

      for (let i = 0; i <= 15; i++) {
        for (let j = 0; j !== 3; j++) {
          await priceOracle.connect(this.signers.validators[j]).vote(INITIAL_PRICE + i * 35);
        }
        await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
      }

      expect(await aprCalculator.rsi()).to.be.equal(0);
    });

    it("should emit event on RSI update", async function () {
      const { aprCalculator, priceOracle, validatorToVote, priceToVote } = await loadFixture(
        this.fixtures.votedValidatorsStateFixture
      );

      await expect(priceOracle.connect(validatorToVote).vote(priceToVote)).to.emit(aprCalculator, "RSIBonusSet");
    });

    it("should properly update average gain or loss", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking, priceOracle } = await loadFixture(
        this.fixtures.rsiOverSoldConditionFixture
      );

      const averageGain = await aprCalculator.averageGain();
      const averageLoss = await aprCalculator.averageLoss();

      // vote price 5 times bigger to update the average gain and loss
      for (let j = 0; j !== 3; j++) {
        await priceOracle.connect(this.signers.validators[j]).vote(INITIAL_PRICE * 5);
      }

      const averageGainAfter = await aprCalculator.averageGain();
      expect(averageGainAfter).to.be.above(averageGain);
      expect(await aprCalculator.averageLoss()).to.be.below(averageLoss);

      // vote price again and see if the average gain and loss are updated properly
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
      for (let j = 0; j !== 3; j++) {
        await priceOracle.connect(this.signers.validators[j]).vote(1);
      }

      expect(await aprCalculator.averageGain()).to.be.below(averageGainAfter);
      expect(await aprCalculator.averageLoss()).to.be.above(averageLoss);
    });

    it("should properly update RSI on slowly moving the price", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking, priceOracle } = await loadFixture(
        this.fixtures.rsiOverSoldConditionFixture
      );
      expect(await aprCalculator.rsi()).to.be.above(0);
      const currentPrice = await aprCalculator.latestDailyPrice();

      for (let i = 0; i !== 21; i++) {
        for (let j = 0; j !== 3; j++) {
          await priceOracle.connect(this.signers.validators[j]).vote(currentPrice.add(1000000));
        }
        await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
        const averageGain = (await aprCalculator.averageGain()).toNumber();
        const averageLoss = (await aprCalculator.averageLoss()).toNumber();
        const rsi = await calculateRSIBonus(averageGain, averageLoss);
        expect(await aprCalculator.rsi()).to.be.equal(rsi);
      }

      expect(await aprCalculator.rsi()).to.be.equal(0);

      for (let i = 0; i !== 3; i++) {
        for (let j = 0; j !== 3; j++) {
          await priceOracle.connect(this.signers.validators[j]).vote(currentPrice);
        }
        await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
        const averageGain = (await aprCalculator.averageGain()).toNumber();
        const averageLoss = (await aprCalculator.averageLoss()).toNumber();
        const rsi = await calculateRSIBonus(averageGain, averageLoss);
        expect(await aprCalculator.rsi()).to.be.equal(rsi);
      }

      expect(await aprCalculator.rsi()).to.be.equal(MAX_RSI_BONUS);
    });

    it("should have same values of RSI Bonus for data table with 300+ elements", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.validatorsDataStateFixture);
      const correctVotingTime = getCorrectVotingTimestamp();

      const newPriceOracleContract = await (await ethers.getContractFactory("PriceOracle")).deploy();
      const newAprCalculator = await (await ethers.getContractFactory("APRCalculator")).deploy();
      const prices: number[] = [];
      for (let i = 0; i < SLOW_SMA - INITIAL_DATA_PRICES.length; i++) {
        // Generate a random number between 300 and 600
        const randomPrice = Math.floor(Math.random() * (600 - 300 + 1)) + 300;
        prices.push(randomPrice);
      }

      for (let i = 0; i < INITIAL_DATA_PRICES.length; i++) {
        prices.push(INITIAL_DATA_PRICES[i]);
      }

      // Initialize the new contracts
      await newAprCalculator
        .connect(this.signers.system)
        .initialize(this.signers.governance.address, systemHydraChain.address, newPriceOracleContract.address, prices);
      await newPriceOracleContract
        .connect(this.signers.system)
        .initialize(systemHydraChain.address, newAprCalculator.address);

      expect(await newAprCalculator.latestDailyPrice()).to.be.equal(INITIAL_DATA_PRICES[INITIAL_DATA_PRICES.length - 1]);
      expect(await newAprCalculator.rsi()).to.be.equal(0);
      expect(TABLE_DATA_PRICES.length, "Array length").to.be.equal(TABLE_DATA_RSI.length);
      await time.setNextBlockTimestamp(correctVotingTime);

      for (let i = 1; i < TABLE_DATA_PRICES.length; i++) {
        for (let j = 0; j !== 3; j++) {
          await newPriceOracleContract.connect(this.signers.validators[j]).vote(TABLE_DATA_PRICES[i]);
        }
        expect(await newAprCalculator.rsi()).to.be.equal(TABLE_DATA_RSI[i]);
        expect(await newAprCalculator.latestDailyPrice()).to.be.equal(TABLE_DATA_PRICES[i]);
        await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY - 133);
      }
    });
  });

  describe("Guard RSIndex", function () {
    it("should successfully guard RSI & disable updates", async function () {
      const { aprCalculator, priceOracle, validatorToVote, priceToVote } = await loadFixture(
        this.fixtures.votedValidatorsStateFixture
      );
      await expect(aprCalculator.connect(this.signers.governance).guardBonuses())
        .to.emit(aprCalculator, "RSIBonusSet")
        .withArgs(0);

      await expect(priceOracle.connect(validatorToVote).vote(priceToVote)).to.not.emit(aprCalculator, "RSIBonusSet");

      const currentRSI = await aprCalculator.getRSIBonus();
      expect(currentRSI).to.equal(0);
      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;
    });

    it("should disable guard and enable RSI updates", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking, priceOracle, validatorToVote, priceToVote } =
        await loadFixture(this.fixtures.votedValidatorsStateFixture);
      await aprCalculator.connect(this.signers.governance).guardBonuses();

      await expect(priceOracle.connect(validatorToVote).vote(priceToVote)).to.not.emit(aprCalculator, "RSIBonusSet");

      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);

      expect(await aprCalculator.disabledBonusesUpdates()).to.be.true;

      await aprCalculator.connect(this.signers.governance).disableGuard();

      expect(await aprCalculator.disabledBonusesUpdates()).to.be.false;

      await priceOracle.connect(this.signers.validators[0]).vote(INITIAL_PRICE / 2);
      await priceOracle.connect(this.signers.validators[1]).vote(INITIAL_PRICE / 2);
      await expect(priceOracle.connect(this.signers.validators[2]).vote(INITIAL_PRICE / 2)).to.emit(
        aprCalculator,
        "RSIBonusSet"
      );
    });

    it("should correctly handle calculations after guard up and then disabled", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking, priceOracle, priceToVote, validatorToVote } =
        await loadFixture(this.fixtures.votedValidatorsStateFixture);

      const averageGain = await aprCalculator.averageGain();
      const averageLoss = await aprCalculator.averageLoss();
      await aprCalculator.connect(this.signers.governance).guardBonuses();
      // the price is updated when the guard is up (bigger than the current price), so it will not be included in the calculation
      await priceOracle.connect(validatorToVote).vote(priceToVote);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
      await aprCalculator.connect(this.signers.governance).disableGuard();
      // update the price again (smaller than the current price) to update the average gain and loss
      for (let j = 0; j !== 3; j++) {
        await priceOracle.connect(this.signers.validators[j]).vote(INITIAL_PRICE / 2);
      }

      expect(await aprCalculator.averageGain(), "gain").to.be.below(averageGain);
      expect(await aprCalculator.averageLoss(), "loss").to.be.above(averageLoss);
    });
  });
}
