/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  DAY,
  DENOMINATOR,
  EPOCHS_YEAR,
  ERRORS,
  INITIAL_BASE_APR,
  INITIAL_MACRO_FACTOR,
  MAX_MACRO_FACTOR,
  MAX_RSI_BONUS,
  MIN_MACRO_FACTOR,
  MIN_RSI_BONUS,
} from "../constants";
import { ethers, network } from "hardhat";
import { applyMaxReward } from "../helper";
import { price } from "../../typechain-types/contracts/APRCalculator/modules";

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
    await expect(aprCalculator.connect(this.signers.system).quotePrice(111)).to.be.revertedWith(
      "PRICE_FOR_EPOCH_ALREADY_QUOTED"
    );
  });

  it("should successfully quotePrice", async function () {
    const { aprCalculator, hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
    const currentEpoch = await hydraChain.currentEpochId();

    expect(await aprCalculator.connect(this.signers.system).quotePrice(132))
      .to.emit(aprCalculator, "PriceQuoted")
      .withArgs(currentEpoch, 132);
    expect(await aprCalculator.priceSumThreshold()).to.equal(132);
    expect(await aprCalculator.priceSumCounter()).to.equal(1);
    expect(await aprCalculator.pricePerEpoch(currentEpoch)).to.equal(132);
  });

  it("should update price after a day", async function () {
    const { aprCalculator, systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const price1 = 132;
    const price2 = 231;
    const price3 = 174;
    const price4 = 189;

    await aprCalculator.connect(this.signers.system).quotePrice(price1);
    await systemHydraChain.commitEpoch(2, this.epoch, this.epochSize, this.uptime);

    await aprCalculator.connect(this.signers.system).quotePrice(price2);
    await systemHydraChain.commitEpoch(3, this.epoch, this.epochSize, this.uptime);

    await aprCalculator.connect(this.signers.system).quotePrice(price3);
    await systemHydraChain.commitEpoch(4, this.epoch, this.epochSize, this.uptime);

    expect(await aprCalculator.priceSumThreshold()).to.equal(price1 + price2 + price3);
    expect(await aprCalculator.priceSumCounter()).to.equal(3);

    // Increase time by a day
    await network.provider.send("evm_increaseTime", [DAY]);
    await network.provider.send("evm_mine");

    await expect(aprCalculator.connect(this.signers.system).quotePrice(price4))
      .to.emit(aprCalculator, "PriceUpdated")
      .withArgs(price4);

    expect(await aprCalculator.currentPrice()).to.equal((price1 + price2 + price3 + price4) / 4);
    expect(await aprCalculator.priceSumThreshold()).to.equal(0);
    expect(await aprCalculator.priceSumCounter()).to.equal(0);
  });
}
