/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
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
import { ethers } from "hardhat";
import { applyMaxReward } from "../helper";

export function RunAPRCalculatorTests(): void {
  describe("", function () {
    describe("Initialization", function () {
      it("should validate default values when AprCalculator deployed", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        expect(aprCalculator.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await aprCalculator.base()).to.equal(0);
        expect(await aprCalculator.macroFactor()).to.equal(0);
        expect(await aprCalculator.rsi()).to.equal(0);

        expect(await aprCalculator.INITIAL_BASE_APR()).to.equal(INITIAL_BASE_APR);
        expect(await aprCalculator.INITIAL_MACRO_FACTOR()).to.equal(INITIAL_MACRO_FACTOR);
        expect(await aprCalculator.MIN_MACRO_FACTOR()).to.equal(MIN_MACRO_FACTOR);
        expect(await aprCalculator.MAX_MACRO_FACTOR()).to.equal(MAX_MACRO_FACTOR);
        expect(await aprCalculator.MIN_RSI_BONUS()).to.be.equal(MIN_RSI_BONUS);
        expect(await aprCalculator.MAX_RSI_BONUS()).to.be.equal(MAX_RSI_BONUS);
        expect(await aprCalculator.EPOCHS_YEAR()).to.be.equal(EPOCHS_YEAR);
        expect(await aprCalculator.DENOMINATOR()).to.be.equal(DENOMINATOR);
      });

      it("should revert initialize if not called by system", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        await expect(aprCalculator.initialize(this.signers.governance.address)).to.be.revertedWithCustomError(
          aprCalculator,
          "Unauthorized"
        );
      });

      it("should initialize correctly", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const managerRole = await aprCalculator.MANAGER_ROLE();
        const adminRole = await aprCalculator.DEFAULT_ADMIN_ROLE();

        expect(await aprCalculator.hasRole(managerRole, this.signers.governance.address)).to.be.true;
        expect(await aprCalculator.hasRole(adminRole, this.signers.governance.address)).to.be.true;
        expect(await aprCalculator.base()).to.be.equal(INITIAL_BASE_APR);
        expect(await aprCalculator.macroFactor()).to.be.equal(INITIAL_MACRO_FACTOR);
        expect(await aprCalculator.rsi()).to.be.equal(0);
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

    describe("Set macro", function () {
      it("should revert when trying to set macro without manager role", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const managerRole = await aprCalculator.MANAGER_ROLE();

        await expect(aprCalculator.setMacro(10000)).to.be.revertedWith(
          ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
        );
      });

      it("should revert when trying to set higher than max macro", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(aprCalculator.connect(this.signers.governance).setMacro(20000)).to.be.revertedWithCustomError(
          aprCalculator,
          "InvalidMacro"
        );
      });

      it("should revert when trying to set lower than min macro", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(aprCalculator.connect(this.signers.governance).setMacro(1000)).to.be.revertedWithCustomError(
          aprCalculator,
          "InvalidMacro"
        );
      });

      it("should set macro", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await aprCalculator.connect(this.signers.governance).setMacro(10000);

        expect(await aprCalculator.macroFactor()).to.be.equal(10000);
      });
    });

    describe("Set RSI", function () {
      it("should revert when trying to set rsi without manager role", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const managerRole = await aprCalculator.MANAGER_ROLE();

        await expect(aprCalculator.setRSI(12000)).to.be.revertedWith(
          ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
        );
      });

      it("should revert when trying to set higher rsi", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(aprCalculator.connect(this.signers.governance).setRSI(20000)).to.be.revertedWithCustomError(
          aprCalculator,
          "InvalidRSI"
        );
      });

      it("should set rsi to zero, if the input is lower than the minimum", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const newRSI = MIN_RSI_BONUS.div(2); // ensure it will be lower than the min
        await aprCalculator.connect(this.signers.governance).setRSI(newRSI);

        expect(await aprCalculator.rsi()).to.be.equal(0);
      });

      it("should set rsi", async function () {
        const { aprCalculator } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await aprCalculator.connect(this.signers.governance).setRSI(12000);

        expect(await aprCalculator.rsi()).to.be.equal(12000);
      });
    });
  });
}
