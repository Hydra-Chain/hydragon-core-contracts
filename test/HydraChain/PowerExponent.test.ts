/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

export function RunPowerExponentTests(): void {
  describe("", async () => {
    it("should revert trying to update the Exponent if we are no-govern address", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.updateExponent(6000)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert trying to update the Exponent invalid small value", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.governance).updateExponent(4999)).to.be.revertedWith(
        "0.5 <= Exponent <= 1"
      );
    });

    it("should revert trying to update the Exponent with invalid big value", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.governance).updateExponent(10001)).to.be.revertedWith(
        "0.5 <= Exponent <= 1"
      );
    });

    it("should update the Exponent and apply to pending", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await hydraChain.connect(this.signers.governance).updateExponent(6000);

      const powerExp = await hydraChain.powerExponent();
      expect(powerExp.value, "powerExp.value").to.equal(5000);
      expect(powerExp.pendingValue, "powerExp.pendingValue").to.equal(6000);
    });

    it("should update the Exponent and commit epoch to apply the pending", async function () {
      const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await systemHydraChain.connect(this.signers.governance).updateExponent(6000);
      await systemHydraChain.commitEpoch(1, this.epoch, this.epochSize, this.uptime);

      const powerExp = await systemHydraChain.powerExponent();
      expect(powerExp.value, "powerExp.value").to.equal(6000);
      expect(powerExp.pendingValue, "powerExp.pendingValue").to.equal(0);
    });
  });
}
