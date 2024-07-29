/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { DAY, ERRORS } from "../constants";
import { ethers } from "hardhat";
import { commitEpoch } from "../helper";

export function RunPriceTests(): void {
  it("should revert quotePrice if not called by system", async function () {
    const { aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

    await expect(aprCalculator.quotePrice(100))
      .to.be.revertedWithCustomError(aprCalculator, ERRORS.unauthorized.name)
      .withArgs(ERRORS.unauthorized.systemCallArg);
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

  it.only("should calculate price correctly", async function () {
    const { aprCalculator, systemHydraChain, hydraStaking } = await loadFixture(
      this.fixtures.initializedHydraChainStateFixture
    );

    const price1 = 132;
    const price2 = 231;
    const price3 = 174;
    const price4 = 189;

    await aprCalculator.connect(this.signers.system).quotePrice(price1);
    await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY / 3);

    await aprCalculator.connect(this.signers.system).quotePrice(price2);
    await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY / 3);

    await aprCalculator.connect(this.signers.system).quotePrice(price3);
    await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY / 3);

    expect(await aprCalculator.dailyPriceQuotesSum(), "dailyPriceQuotesSum").to.equal(price1 + price2 + price3);
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
}
