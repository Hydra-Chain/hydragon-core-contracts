/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  DENOMINATOR,
  EPOCHS_YEAR,
  ERRORS,
  INITIAL_BASE_APR,
  INITIAL_MACRO_FACTOR,
  MAX_RSI_BONUS,
  MIN_RSI_BONUS,
} from "../constants";
import { ethers } from "hardhat";
import { applyMaxReward } from "../helper";

export function RunAPRTests(): void {
  describe("Initialization", function () {
    it("should initialize correctly", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);
      const managerRole = await rewardPool.MANAGER_ROLE();
      const adminRole = await rewardPool.DEFAULT_ADMIN_ROLE();

      expect(await rewardPool.hasRole(managerRole, this.signers.governance.address)).to.be.true;
      expect(await rewardPool.hasRole(adminRole, this.signers.governance.address)).to.be.true;
      expect(await rewardPool.base()).to.be.equal(INITIAL_BASE_APR);
      expect(await rewardPool.macroFactor()).to.be.equal(INITIAL_MACRO_FACTOR);
      expect(await rewardPool.rsi()).to.be.equal(0);
      expect(await rewardPool.MIN_RSI_BONUS()).to.be.equal(MIN_RSI_BONUS);
      expect(await rewardPool.MAX_RSI_BONUS()).to.be.equal(MAX_RSI_BONUS);
      expect(await rewardPool.EPOCHS_YEAR()).to.be.equal(EPOCHS_YEAR);
      expect(await rewardPool.DENOMINATOR()).to.be.equal(DENOMINATOR);
    });

    it("should initialize vesting bonus", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      expect(await rewardPool.getVestingBonus(1)).to.be.equal(6);
      expect(await rewardPool.getVestingBonus(52)).to.be.equal(2178);
    });

    it("should get max RSI", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      expect(await rewardPool.MAX_RSI_BONUS()).to.be.equal(MAX_RSI_BONUS);
    });

    it("should get max APR", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      const base = await rewardPool.base();
      const macroFactor = await rewardPool.macroFactor();
      const vestingBonus = await rewardPool.getVestingBonus(52);
      const rsiBonus = await rewardPool.MAX_RSI_BONUS();
      const nominator = base.add(vestingBonus).mul(macroFactor).mul(rsiBonus);
      const denominator = DENOMINATOR.mul(DENOMINATOR).mul(DENOMINATOR);

      const maxAPR = await rewardPool.getMaxAPR();
      expect(maxAPR.nominator).to.be.equal(nominator);
      expect(maxAPR.denominator).to.be.equal(denominator);
    });

    it("should apply max rewards", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      const reward = ethers.BigNumber.from(10);
      const maxReward = await applyMaxReward(rewardPool, reward);

      expect(await rewardPool.applyMaxReward(reward)).to.be.equal(maxReward);
    });

    it("should get epoch max reward", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      const totalStaked = ethers.BigNumber.from(1000);
      const maxAPR = await rewardPool.getMaxAPR();
      const maxEpochReward = totalStaked.mul(maxAPR.nominator).div(maxAPR.denominator).div(EPOCHS_YEAR);

      expect(await rewardPool.getEpochMaxReward(totalStaked)).to.be.equal(maxEpochReward);
    });
  });

  describe("Set base", function () {
    it("should revert when trying to set base without manager role", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);
      const managerRole = await rewardPool.MANAGER_ROLE();

      await expect(rewardPool.setBase(1500)).to.be.revertedWith(
        ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
      );
    });

    it("should set base", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      await rewardPool.connect(this.signers.governance).setBase(1500);

      expect(await rewardPool.base()).to.be.equal(1500);
    });
  });

  describe("Set macro", function () {
    it("should revert when trying to set macro without manager role", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);
      const managerRole = await rewardPool.MANAGER_ROLE();

      await expect(rewardPool.setMacro(10000)).to.be.revertedWith(
        ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
      );
    });

    it("should set macro", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      await rewardPool.connect(this.signers.governance).setMacro(10000);

      expect(await rewardPool.macroFactor()).to.be.equal(10000);
    });
  });

  describe("Set RSI", function () {
    it("should revert when trying to set rsi without manager role", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);
      const managerRole = await rewardPool.MANAGER_ROLE();

      await expect(rewardPool.setRSI(12000)).to.be.revertedWith(
        ERRORS.accessControl(this.signers.accounts[0].address.toLocaleLowerCase(), managerRole)
      );
    });

    it("should revert when trying to set higher rsi", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      await expect(rewardPool.connect(this.signers.governance).setRSI(20000)).to.be.revertedWithCustomError(
        rewardPool,
        "InvalidRSI"
      );
    });

    it("should set rsi to zero, if the input is lower than the minimum", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);
      const newRSI = MIN_RSI_BONUS.div(2); // ensure it will be lower than the min
      await rewardPool.connect(this.signers.governance).setRSI(newRSI);

      expect(await rewardPool.rsi()).to.be.equal(0);
    });

    it("should set rsi", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.initializedValidatorSetStateFixture);

      await rewardPool.connect(this.signers.governance).setRSI(12000);

      expect(await rewardPool.rsi()).to.be.equal(12000);
    });
  });
}
