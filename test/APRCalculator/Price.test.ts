/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { DAY, ERRORS, INITIAL_PRICE, WEEK } from "../constants";
import { ethers } from "hardhat";
import { commitEpoch } from "../helper";

export function RunPriceTests(): void {
  describe("quotePrice", function () {
    it("should revert quotePrice if not called by system", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

      await expect(aprCalculator.quotePrice(100))
        .to.be.revertedWithCustomError(aprCalculator, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.systemCallArg);
    });

    it("should revert quotePrice if price is 0", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(aprCalculator.connect(this.signers.system).quotePrice(0)).to.be.revertedWithCustomError(
        aprCalculator,
        "InvalidPrice"
      );
    });

    it("should revert quotePrice if we already updated the price for the current epoch", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await aprCalculator.connect(this.signers.system).quotePrice(100);
      await expect(aprCalculator.connect(this.signers.system).quotePrice(111)).to.be.revertedWithCustomError(
        aprCalculator,
        "PriceAlreadyQuoted"
      );
    });

    it("should successfully quotePrice", async function () {
      const { aprCalculator, hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
      const currentEpoch = await hydraChain.currentEpochId();

      expect(await aprCalculator.connect(this.signers.system).quotePrice(132))
        .to.emit(aprCalculator, "PriceQuoted")
        .withArgs(currentEpoch, 132);
      expect(await aprCalculator.dailyPriceQuotesSum()).to.equal(132);
      expect(await aprCalculator.priceSumCounter()).to.equal(1);
      expect(await aprCalculator.pricePerEpoch(currentEpoch)).to.equal(132);
    });
  });

  describe("updatePrice", function () {
    it("should not update time if no price was quoted", async function () {
      const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      // increase time so it pass update time
      await ethers.provider.send("evm_increaseTime", [10000]);
      await ethers.provider.send("evm_mine", []);

      await expect(aprCalculator.connect(this.signers.system).quotePrice(100)).to.not.emit(
        aprCalculator,
        "PriceUpdated"
      );
      expect(await aprCalculator.latestDailyPrice()).to.equal(INITIAL_PRICE);
    });

    it("should make sure update time is always 00:00:00 for the next day", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );
      await aprCalculator.connect(this.signers.system).quotePrice(100);
      // increase time so it pass update by more than a week
      await ethers.provider.send("evm_increaseTime", [1000000]);
      await ethers.provider.send("evm_mine", []);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize);

      const updateTimeBefore = await aprCalculator.updateTime();
      expect(updateTimeBefore.add(WEEK)).to.be.below((await ethers.provider.getBlock("latest")).timestamp);

      await aprCalculator.connect(this.signers.system).quotePrice(100);
      const updateTimeAfter = await aprCalculator.updateTime();
      expect(updateTimeAfter).to.be.above((await ethers.provider.getBlock("latest")).timestamp);
      expect(updateTimeAfter.mod(DAY)).to.equal(0);
    });

    it("should update price after a day", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      await aprCalculator.connect(this.signers.system).quotePrice(111);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize);

      expect(await aprCalculator.dailyPriceQuotesSum(), "dailyPriceQuotesSum").to.equal(111);
      expect(await aprCalculator.priceSumCounter(), "priceSumCounter").to.equal(1);

      // Get timestamp & update time
      const block = await ethers.provider.getBlock("latest");
      const currentTimestamp = block.timestamp;
      const updateTime = await aprCalculator.updateTime();
      const dayBigNum = ethers.BigNumber.from(DAY);

      await expect(aprCalculator.connect(this.signers.system).quotePrice(222))
        .to.emit(aprCalculator, "PriceUpdated")
        .withArgs(currentTimestamp + 1, 111);

      expect(await aprCalculator.latestDailyPrice(), "latestDailyPrice").to.equal(111);
      expect(await aprCalculator.dailyPriceQuotesSum()).to.equal(222);
      expect(await aprCalculator.priceSumCounter()).to.equal(1);
      expect(await aprCalculator.updateTime()).to.equal(updateTime.add(dayBigNum));
    });

    it("should calculate price correctly", async function () {
      const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      // Handle time to be at the start of the day
      const currBlock = await ethers.provider.getBlock("latest");
      const time = currBlock.timestamp;
      const nextUpdateTime = time + (86400 - (time % 86400));
      const neededTime = nextUpdateTime - time;

      await ethers.provider.send("evm_increaseTime", [neededTime]);
      await ethers.provider.send("evm_mine", []);

      const price1 = 132;
      const price2 = 231;
      const price3 = 174;
      const price4 = 189;

      // we need to quote price here, cuz the counter is 0 and we still have not updated the price
      await aprCalculator.connect(this.signers.system).quotePrice(1);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, 1);

      await aprCalculator.connect(this.signers.system).quotePrice(price1);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY / 3);

      await aprCalculator.connect(this.signers.system).quotePrice(price2);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY / 3);

      await aprCalculator.connect(this.signers.system).quotePrice(price3);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY / 3);

      expect(await aprCalculator.dailyPriceQuotesSum(), "dailyPriceQuotesSum before").to.equal(
        price1 + price2 + price3
      );
      expect(await aprCalculator.priceSumCounter(), "priceSumCounter").to.equal(3);

      // Get timestamp & update time
      const block = await ethers.provider.getBlock("latest");
      const currentTimestamp = block.timestamp;
      const updateTime = await aprCalculator.updateTime();
      const dayBigNum = ethers.BigNumber.from(DAY);
      const updatedPrice = (price1 + price2 + price3) / 3;

      await expect(aprCalculator.connect(this.signers.system).quotePrice(price4))
        .to.emit(aprCalculator, "PriceUpdated")
        .withArgs(currentTimestamp + 1, updatedPrice);

      expect(await aprCalculator.latestDailyPrice(), "latestDailyPrice").to.equal(updatedPrice);
      expect(await aprCalculator.dailyPriceQuotesSum(), "dailyPriceQuotesSum after").to.equal(price4);
      expect(await aprCalculator.priceSumCounter(), "priceSumCounter after").to.equal(1);
      expect(await aprCalculator.updateTime()).to.equal(updateTime.add(dayBigNum));
    });
  });
}
