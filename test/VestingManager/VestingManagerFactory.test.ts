/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { createNewVestManager } from "../helper";
import { ERRORS } from "../constants";

export function RunVestManagerFactoryTests(): void {
  describe("", function () {
    describe("VestingManagerFactory initializations", function () {
      it("should validate default values when VestingManagerFactory deployed", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        expect(vestingManagerFactory.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await vestingManagerFactory.beacon()).to.equal(hre.ethers.constants.AddressZero);
      });

      it("should revert when initialized without system call", async function () {
        const { vestingManagerFactory, hydraDelegation } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

        await expect(vestingManagerFactory.initialize(hydraDelegation.address))
          .to.be.revertedWithCustomError(vestingManagerFactory, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.systemCallArg);
      });

      it("should initialize successfully", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        expect(await vestingManagerFactory.beacon()).to.not.equal(hre.ethers.constants.AddressZero);
      });

      it("should revert on re-initialization attempt", async function () {
        const { hydraDelegation, vestingManagerFactory } = await loadFixture(
          this.fixtures.initializedHydraChainStateFixture
        );

        await expect(
          vestingManagerFactory.connect(this.signers.system).initialize(hydraDelegation.address)
        ).to.be.revertedWith(ERRORS.initialized);
      });
    });

    describe("VestingManagerFactory functions & variables", function () {
      it("should check that mappings properly save data for vesting managers", async function () {
        const { vestingManagerFactory, vestManager, vestManagerOwner } = await loadFixture(
          this.fixtures.vestManagerFixture
        );
        const { newManager } = await createNewVestManager(vestingManagerFactory, vestManagerOwner);

        expect(await vestingManagerFactory.vestingManagerOwner(vestManager.address)).to.be.equal(
          vestManagerOwner.address
        );

        expect(await vestingManagerFactory.vestingManagerOwner(newManager.address)).to.be.equal(
          vestManagerOwner.address
        );

        expect(await vestingManagerFactory.userVestingManagers(vestManagerOwner.address, 0)).to.be.equal(
          vestManager.address
        );
        expect(await vestingManagerFactory.userVestingManagers(vestManagerOwner.address, 1)).to.be.equal(
          newManager.address
        );
      });

      it("should return false when checking if an address is not a vesting manager", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.vestManagerFixture);

        expect(await vestingManagerFactory.isVestingManager(this.signers.delegator.address)).to.be.false;
      });

      it("should return true when checking if an address is a vesting manager", async function () {
        const { vestingManagerFactory, vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        expect(await vestingManagerFactory.isVestingManager(vestManager.address)).to.be.true;
      });

      it("should return empty array if user do not have any managers", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        expect(await vestingManagerFactory.getUserVestingManagers(this.signers.delegator.address)).to.be.deep.equal([]);
      });

      it("should return the vesting managers for a user", async function () {
        const { vestingManagerFactory, vestManager, vestManagerOwner } = await loadFixture(
          this.fixtures.vestManagerFixture
        );
        const { newManager } = await createNewVestManager(vestingManagerFactory, vestManagerOwner);

        expect(await vestingManagerFactory.getUserVestingManagers(vestManagerOwner.address)).to.be.deep.equal([
          vestManager.address,
          newManager.address,
        ]);
      });
    });

    describe("Creating New Manager", function () {
      it("should revert when trying to create a new vesting manager with address(0)", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.vestManagerFixture);
        const zeroAddress = await hre.ethers.getSigner(hre.ethers.constants.AddressZero);

        await expect(vestingManagerFactory.connect(zeroAddress).newVestingManager()).to.be.revertedWithCustomError(
          vestingManagerFactory,
          "InvalidOwner"
        );
      });

      it("should create a new vesting manager", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(vestingManagerFactory.connect(this.signers.delegator).newVestingManager()).to.not.be.reverted;

        expect(await vestingManagerFactory.getUserVestingManagers(this.signers.delegator.address)).to.not.be.equal([]);
      });

      it("should emit NewVestingManager event", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(vestingManagerFactory.newVestingManager()).to.emit(vestingManagerFactory, "NewVestingManager");
      });
    });
  });
}
