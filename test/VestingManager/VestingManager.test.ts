/* eslint-disable node/no-extraneous-import */
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { RunVestManagerFactoryTests } from "./VestingManagerFactory.test";

export function RunVestingManagerTests(): void {
  describe("", function () {
    describe("VestingManager initializations", function () {
      it("should validate values when VestingManager is cloned", async function () {
        const { vestManager, hydraDelegation, vestManagerOwner } = await loadFixture(this.fixtures.vestManagerFixture);

        expect(await vestManager.HYDRA_DELEGATION()).to.equal(hydraDelegation.address);
        expect(await vestManager.owner()).to.equal(vestManagerOwner.address);
      });

      it("should revert on re-initialization attempt", async function () {
        const { vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(vestManager.initialize(this.signers.delegator.address)).to.be.revertedWith(
          "Initializable: contract is already initialized"
        );
      });
    });

    describe("VestingManagerFactory", function () {
      RunVestManagerFactoryTests();
    });
  });
}
