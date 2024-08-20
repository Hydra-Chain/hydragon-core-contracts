import { ethers } from "hardhat";
/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { ERRORS } from "../constants";
import { getCurrentDay } from "../helper";

export function RunPriceOracleTests(): void {
  describe("Initialization", function () {
    it("should validate default values when PriceOracle is deployed", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

      expect(await priceOracle.VOTING_POWER_PERCENTAGE_NEEDED()).to.equal(61);
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

    it("should revert re-initializing attempt", async function () {
      const { priceOracle, hydraChain, aprCalculator } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      await expect(priceOracle.initialize(hydraChain.address, aprCalculator.address)).to.be.revertedWith(
        ERRORS.initialized
      );
    });
  });

  describe("Voting for price", function () {
    it("should revert when vote with non-active validator", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(priceOracle.connect(this.signers.validators[2]).vote(21))
        .to.be.revertedWithCustomError(priceOracle, "InvalidVote")
        .withArgs("NOT_VALIDATOR");
    });

    it("should revert vote with 0 price", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(priceOracle.connect(this.signers.validators[0]).vote(0)).to.be.revertedWithCustomError(
        priceOracle,
        "InvalidPrice"
      );
    });

    it("should vote successfully", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);
      const currentDay = await getCurrentDay();

      await expect(priceOracle.connect(this.signers.validators[0]).vote(21))
        .to.emit(priceOracle, "PriceVoted")
        .withArgs(21, this.signers.validators[0].address, currentDay);
      expect(await priceOracle.validatorLastVotedDay(this.signers.validators[0].address)).to.equal(currentDay);

      const pricesForDay = await priceOracle.priceVotesForDay(currentDay, [0]);
      expect(pricesForDay.price).to.equal(21);
      expect(pricesForDay.validator).to.equal(this.signers.validators[0].address);
    });

    it("should revert double voting in the same day", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await priceOracle.connect(this.signers.validators[0]).vote(21);

      await expect(priceOracle.connect(this.signers.validators[0]).vote(25))
        .to.be.revertedWithCustomError(priceOracle, "InvalidVote")
        .withArgs("ALREADY_VOTED");
    });

    it("should revert vote when price for the day is updated", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await priceOracle.connect(this.signers.validators[0]).vote(21);
      await priceOracle.connect(this.signers.validators[1]).vote(21);
      await priceOracle.connect(this.signers.validators[2]).vote(21);
      await priceOracle.connect(this.signers.validators[3]).vote(21);

      await expect(priceOracle.connect(this.signers.validators[1]).vote(25))
        .to.be.revertedWithCustomError(priceOracle, "InvalidVote")
        .withArgs("PRICE_ALREADY_SET");
    });
  });

  describe("Price update", function () {
    it("should not update price if votes are less than 4, even if they have enough power", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await priceOracle.connect(this.signers.validators[0]).vote(21);
      await priceOracle.connect(this.signers.validators[1]).vote(21);
      await expect(priceOracle.connect(this.signers.validators[2]).vote(21)).to.not.emit(priceOracle, "PriceUpdated");
    });

    it("should not update price, if there is is not enough power for a price (rounding to 1%)", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await priceOracle.connect(this.signers.validators[0]).vote(10);
      await priceOracle.connect(this.signers.validators[1]).vote(14);
      await priceOracle.connect(this.signers.validators[2]).vote(18);
      await expect(priceOracle.connect(this.signers.validators[3]).vote(24)).to.not.emit(priceOracle, "PriceUpdated");
    });

    it("should update price successfully", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);
      const currentDay = await getCurrentDay();

      await priceOracle.connect(this.signers.validators[0]).vote(221);
      await priceOracle.connect(this.signers.validators[1]).vote(221);
      await priceOracle.connect(this.signers.validators[2]).vote(221);
      await expect(priceOracle.connect(this.signers.validators[3]).vote(221))
        .to.emit(priceOracle, "PriceUpdated")
        .withArgs(221, currentDay);
      expect(await priceOracle.pricePerDay(currentDay)).to.equal(221);
    });

    it("should update price if 61% power agrees on price (rounding to 1%), even if other validators voted for different price", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);
      const currentDay = await getCurrentDay();

      await priceOracle.connect(this.signers.validators[0]).vote(142);
      await priceOracle.connect(this.signers.validators[1]).vote(56);
      await priceOracle.connect(this.signers.validators[2]).vote(56);
      await expect(priceOracle.connect(this.signers.validators[3]).vote(56))
        .to.emit(priceOracle, "PriceUpdated")
        .withArgs(56, currentDay);
    });

    it("should update the average price of votes (if they are all around the same value to 1% one after another)", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);
      const currentDay = await getCurrentDay();

      const price1 = 222222221;
      const price2 = 222222222;
      const price3 = 222222228;
      const expectedPrice = Math.floor((price1 + price2 + price3) / 3);

      await priceOracle.connect(this.signers.validators[0]).vote(price1);
      await priceOracle.connect(this.signers.validators[1]).vote(price2);
      await priceOracle.connect(this.signers.validators[2]).vote(price3);
      // the last vote does not matter, since others already have enough power to update the price
      await expect(priceOracle.connect(this.signers.validators[3]).vote(1))
        .to.emit(priceOracle, "PriceUpdated")
        .withArgs(expectedPrice, currentDay);
    });

    it("should not revert vote if APRCalculator priceUpdate fails, it does not update the price & emit event for fail", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      const currentDay = await getCurrentDay();
      const newPriceOracleContract = await (await ethers.getContractFactory("PriceOracle")).deploy();
      await newPriceOracleContract.connect(this.signers.system).initialize(hydraChain.address, hydraChain.address);

      await newPriceOracleContract.connect(this.signers.validators[0]).vote(56);
      await newPriceOracleContract.connect(this.signers.validators[1]).vote(56);
      await newPriceOracleContract.connect(this.signers.validators[2]).vote(56);
      const lastVote = await newPriceOracleContract.connect(this.signers.validators[3]).vote(56);
      await expect(lastVote).to.emit(newPriceOracleContract, "PriceUpdateFailed");
      await expect(lastVote).to.not.emit(newPriceOracleContract, "PriceUpdated");
      expect(await newPriceOracleContract.pricePerDay(currentDay)).to.equal(0);
    });
  });
}
