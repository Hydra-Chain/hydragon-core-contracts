import { ethers } from "hardhat";
/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { ERRORS } from "../constants";

export function RunPriceOracleTests(): void {
  describe.only("Initialization", function () {
    it("should validate default values when PriceOracle is deployed", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

      expect(await priceOracle.hydraChainContract()).to.equal(ethers.constants.AddressZero);
      expect(await priceOracle.aprCalculatorContract()).to.equal(ethers.constants.AddressZero);
    });

    it("should revert when initialize without system call", async function () {
      const { priceOracle, hydraChain, aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

      await expect(priceOracle.initialize(hydraChain.address, aprCalculator.address))
        .to.be.revertedWithCustomError(priceOracle, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.systemCallArg);
    });

    it("should initialize successfully", async function () {
      const { priceOracle, hydraChain, aprCalculator } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      expect(await priceOracle.hydraChainContract()).to.equal(hydraChain.address);
      expect(await priceOracle.aprCalculatorContract()).to.equal(aprCalculator.address);
    });
  });
}
