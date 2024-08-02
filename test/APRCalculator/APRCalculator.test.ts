/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  ARRAY_310_ELEMENTS,
  DENOMINATOR,
  EPOCHS_YEAR,
  ERRORS,
  FAST_SMA,
  INITIAL_BASE_APR,
  INITIAL_DEFAULT_MACRO_FACTOR,
  INITIAL_PRICE,
  MAX_MACRO_FACTOR,
  MAX_RSI_BONUS,
  MIN_MACRO_FACTOR,
  SLOW_SMA,
} from "../constants";
import { ethers } from "hardhat";
import { applyMaxReward } from "../helper";
import { RunPriceTests } from "./Price.test";
import { RunRSIndexTests } from "./RSIndex.test";
import { RunMacroFactorTests } from "./MacroFactor.test";

export function RunAPRCalculatorTests(): void {
  describe.only("", function () {
    describe("Initialization", function () {
      it("should validate default values when AprCalculator deployed", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        expect(aprCalculator.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await aprCalculator.base()).to.equal(0);
        expect(await aprCalculator.INITIAL_BASE_APR()).to.equal(INITIAL_BASE_APR);
        expect(await aprCalculator.EPOCHS_YEAR()).to.be.equal(EPOCHS_YEAR);
        expect(await aprCalculator.DENOMINATOR()).to.be.equal(DENOMINATOR);

        // RSIndex
        expect(await aprCalculator.MAX_RSI_BONUS()).to.be.equal(MAX_RSI_BONUS);
        expect(await aprCalculator.rsi()).to.be.equal(0);
        expect(await aprCalculator.disabledRSI()).to.be.false;
        expect(await aprCalculator.averageGain()).to.be.equal(0);
        expect(await aprCalculator.averageLoss()).to.be.equal(0);

        // Macro Factor
        expect(await aprCalculator.MIN_MACRO_FACTOR()).to.equal(MIN_MACRO_FACTOR);
        expect(await aprCalculator.MAX_MACRO_FACTOR()).to.equal(MAX_MACRO_FACTOR);
        expect(await aprCalculator.FAST_SMA()).to.equal(FAST_SMA);
        expect(await aprCalculator.SLOW_SMA()).to.equal(SLOW_SMA);
        expect(await aprCalculator.disabledMacro()).to.equal(false);
        expect(await aprCalculator.macroFactor()).to.equal(0);
        expect(await aprCalculator.defaultMacroFactor()).to.equal(0);
        expect(await aprCalculator.smaFastSum()).to.equal(0);
        expect(await aprCalculator.smaSlowSum()).to.equal(0);

        // Price
        expect(await aprCalculator.updateTime()).to.equal(0);
        expect(await aprCalculator.latestDailyPrice()).to.equal(0);
        expect(await aprCalculator.priceSumCounter()).to.equal(0);
        expect(await aprCalculator.dailyPriceQuotesSum()).to.equal(0);
        expect(await aprCalculator.hydraChainContract()).to.equal(ethers.constants.AddressZero);
      });

      it("should revert initialize if not called by system", async function () {
        const { aprCalculator, hydraChain } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        await expect(
          aprCalculator.initialize(this.signers.governance.address, hydraChain.address, ARRAY_310_ELEMENTS)
        ).to.be.revertedWithCustomError(aprCalculator, ERRORS.unauthorized.name);
      });

      it("should initialize correctly", async function () {
        const { aprCalculator, hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const managerRole = await aprCalculator.MANAGER_ROLE();
        const adminRole = await aprCalculator.DEFAULT_ADMIN_ROLE();

        expect(await aprCalculator.hasRole(managerRole, this.signers.governance.address)).to.be.true;
        expect(await aprCalculator.hasRole(adminRole, this.signers.governance.address)).to.be.true;
        expect(await aprCalculator.base()).to.be.equal(INITIAL_BASE_APR);
        expect(await aprCalculator.rsi()).to.be.equal(0);

        // Macro Factor
        expect(await aprCalculator.defaultMacroFactor()).to.equal(INITIAL_DEFAULT_MACRO_FACTOR);
        expect(await aprCalculator.macroFactor())
          .to.least(MIN_MACRO_FACTOR)
          .and.to.be.most(MAX_MACRO_FACTOR);
        expect(await aprCalculator.smaFastSum()).to.above(0);
        expect(await aprCalculator.smaSlowSum()).to.above(0);

        // Price
        const updateTime = await aprCalculator.updateTime();
        const updateTimeDate = new Date(updateTime.toNumber() * 1000);
        expect(updateTimeDate.getUTCHours()).to.equal(0);
        expect(updateTimeDate.getUTCMinutes()).to.equal(0);
        expect(updateTimeDate.getUTCSeconds()).to.equal(0);
        expect(await aprCalculator.latestDailyPrice()).to.be.equal(INITIAL_PRICE);
        expect(await aprCalculator.hydraChainContract()).to.equal(hydraChain.address);
      });

      it("should revert initialize if already initialized", async function () {
        const { aprCalculator, hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(
          aprCalculator.initialize(this.signers.system.address, hydraChain.address, ARRAY_310_ELEMENTS)
        ).to.be.revertedWith(ERRORS.initialized);
      });

      it("should initialize vesting bonus", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        expect(await aprCalculator.getVestingBonus(1)).to.be.equal(6);
        expect(await aprCalculator.getVestingBonus(52)).to.be.equal(2178);
      });

      it("should get max APR", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        const base = await aprCalculator.base();
        const macroFactor = await aprCalculator.macroFactor();
        const vestingBonus = await aprCalculator.getVestingBonus(52);
        const rsiBonus = await aprCalculator.MAX_RSI_BONUS();
        const nominator = base.add(vestingBonus).mul(macroFactor).mul(rsiBonus);
        const denominator = DENOMINATOR.mul(DENOMINATOR).mul(DENOMINATOR);

        const maxAPR = await aprCalculator.getMaxAPR();
        expect(maxAPR.nominator).to.be.equal(nominator);
        expect(maxAPR.denominator).to.be.equal(denominator);
      });

      it("should apply max rewards", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        const reward = ethers.BigNumber.from(10);
        const maxReward = await applyMaxReward(aprCalculator, reward);

        expect(await aprCalculator.applyMaxReward(reward)).to.be.equal(maxReward);
      });

      it("should get epoch max reward", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        const totalStaked = ethers.BigNumber.from(1000);
        const maxAPR = await aprCalculator.getMaxAPR();
        const maxEpochReward = totalStaked.mul(maxAPR.nominator).div(maxAPR.denominator).div(EPOCHS_YEAR);

        expect(await aprCalculator.getEpochMaxReward(totalStaked)).to.be.equal(maxEpochReward);
      });
    });

    describe("Set base", function () {
      it("should revert when trying to set base without manager role", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const managerRole = await aprCalculator.MANAGER_ROLE();

        await expect(aprCalculator.setBase(1500)).to.be.revertedWith(
          ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
        );
      });

      it("should set base", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await aprCalculator.connect(this.signers.governance).setBase(1500);

        expect(await aprCalculator.base()).to.be.equal(1500);
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
