/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  ARRAY_310_ELEMENTS,
  DENOMINATOR,
  ERRORS,
  FAST_SMA,
  BASE_APR,
  INITIAL_DEFAULT_MACRO_FACTOR,
  INITIAL_PRICE,
  MAX_MACRO_FACTOR,
  MAX_RSI_BONUS,
  MIN_MACRO_FACTOR,
  SLOW_SMA,
} from "../constants";
import { ethers } from "hardhat";
import { RunPriceTests } from "./Price.test";
import { RunRSIndexTests } from "./RSIndex.test";
import { RunMacroFactorTests } from "./MacroFactor.test";

export function RunAPRCalculatorTests(): void {
  describe("", function () {
    describe("Initialization", function () {
      it("should validate default values when AprCalculator deployed", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        expect(aprCalculator.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await aprCalculator.DENOMINATOR()).to.be.equal(DENOMINATOR);
        expect(await aprCalculator.BASE_APR()).to.equal(BASE_APR);
        expect(await aprCalculator.hasRole(await aprCalculator.DEFAULT_ADMIN_ROLE(), this.signers.governance.address))
          .to.be.false;

        // RSIndex
        expect(await aprCalculator.MAX_RSI_BONUS()).to.be.equal(MAX_RSI_BONUS);
        expect(await aprCalculator.rsi()).to.be.equal(0);
        expect(await aprCalculator.averageGain()).to.be.equal(0);
        expect(await aprCalculator.averageLoss()).to.be.equal(0);

        // Macro Factor
        expect(await aprCalculator.MIN_MACRO_FACTOR()).to.equal(MIN_MACRO_FACTOR);
        expect(await aprCalculator.MAX_MACRO_FACTOR()).to.equal(MAX_MACRO_FACTOR);
        expect(await aprCalculator.FAST_SMA()).to.equal(FAST_SMA);
        expect(await aprCalculator.SLOW_SMA()).to.equal(SLOW_SMA);
        expect(await aprCalculator.macroFactor()).to.equal(0);
        expect(await aprCalculator.defaultMacroFactor()).to.equal(0);
        expect(await aprCalculator.smaFastSum()).to.equal(0);
        expect(await aprCalculator.smaSlowSum()).to.equal(0);

        // Price
        expect(await aprCalculator.latestDailyPrice()).to.equal(0);
        expect(await aprCalculator.disabledBonusesUpdates()).to.equal(false);
        expect(await aprCalculator.hydraChainContract()).to.equal(ethers.constants.AddressZero);
        expect(await aprCalculator.priceOracleContract()).to.equal(ethers.constants.AddressZero);
      });

      it("should revert initialize if not called by system", async function () {
        const { aprCalculator, hydraChain, priceOracle } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

        await expect(
          aprCalculator.initialize(
            this.signers.governance.address,
            hydraChain.address,
            priceOracle.address,
            ARRAY_310_ELEMENTS
          )
        ).to.be.revertedWithCustomError(aprCalculator, ERRORS.unauthorized.name);
      });

      it("should initialize correctly", async function () {
        const { aprCalculator, hydraChain, priceOracle } = await loadFixture(
          this.fixtures.initializedHydraChainStateFixture
        );

        expect(await aprCalculator.hasRole(await aprCalculator.DEFAULT_ADMIN_ROLE(), this.signers.governance.address))
          .to.be.true;

        // Macro Factor
        expect(await aprCalculator.defaultMacroFactor()).to.equal(INITIAL_DEFAULT_MACRO_FACTOR);
        expect(await aprCalculator.macroFactor())
          .to.least(0)
          .and.to.be.most(MAX_RSI_BONUS);
        expect(await aprCalculator.smaFastSum()).to.above(0);
        expect(await aprCalculator.smaSlowSum()).to.above(0);

        // RSIndex
        expect(await aprCalculator.rsi())
          .to.be.least(0)
          .and.to.be.most(MAX_RSI_BONUS);
        expect(await aprCalculator.averageGain()).to.be.not.equal(0);
        expect(await aprCalculator.averageLoss()).to.be.not.equal(0);

        // Price
        expect(await aprCalculator.latestDailyPrice()).to.be.equal(INITIAL_PRICE);
        expect(await aprCalculator.hydraChainContract()).to.equal(hydraChain.address);
        expect(await aprCalculator.priceOracleContract()).to.equal(priceOracle.address);
      });

      it("should revert initialize if already initialized", async function () {
        const { aprCalculator, hydraChain, priceOracle } = await loadFixture(
          this.fixtures.initializedHydraChainStateFixture
        );

        await expect(
          aprCalculator.initialize(
            this.signers.system.address,
            hydraChain.address,
            priceOracle.address,
            ARRAY_310_ELEMENTS
          )
        ).to.be.revertedWith(ERRORS.initialized);
      });

      it("should initialize vesting bonus", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        expect(await aprCalculator.getVestingBonus(1)).to.be.equal(6);
        expect(await aprCalculator.getVestingBonus(52)).to.be.equal(2178);
      });

      it("should get max APR", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        const base = await aprCalculator.BASE_APR();
        const macroFactor = await aprCalculator.MAX_MACRO_FACTOR();
        const vestingBonus = await aprCalculator.getVestingBonus(52);
        const rsiBonus = await aprCalculator.MAX_RSI_BONUS();
        const nominator = base.add(vestingBonus).mul(macroFactor).mul(rsiBonus);
        const denominator = DENOMINATOR.mul(DENOMINATOR).mul(DENOMINATOR);
        const maxAPR = await aprCalculator.getMaxAPR();

        expect(maxAPR.nominator).to.be.equal(nominator);
        expect(maxAPR.denominator).to.be.equal(denominator);
      });

      it("should get max yearly reward", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        const totalStaked = ethers.BigNumber.from(1000);
        const maxAPR = await aprCalculator.getMaxAPR();
        const maxYearlyReward = totalStaked.mul(maxAPR.nominator).div(maxAPR.denominator);

        expect(await aprCalculator.getMaxYearlyReward(totalStaked)).to.be.equal(maxYearlyReward);
      });
    });

    describe("Price", function () {
      RunPriceTests();
    });
    describe("RSIndex", function () {
      RunRSIndexTests();
    });
    describe("Macro Factor", function () {
      RunMacroFactorTests();
    });
  });
}
