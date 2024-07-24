/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { ERRORS } from "../constants";

export function RunAccessControlTests(): void {
  describe("Whitelist", function () {
    it("should be modified only by the owner", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(
        hydraChain.connect(this.signers.validators[0]).addToWhitelist([this.signers.validators[0].address]),
        "addToWhitelist"
      ).to.be.revertedWith(ERRORS.ownable);

      await expect(
        hydraChain.connect(this.signers.validators[0]).removeFromWhitelist([this.signers.validators[0].address]),
        "removeFromWhitelist"
      ).to.be.revertedWith(ERRORS.ownable);
    });

    it("should be able to add to whitelist", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(
        hydraChain
          .connect(this.signers.governance)
          .addToWhitelist([this.signers.validators[0].address, this.signers.validators[1].address])
      ).to.not.be.reverted;

      expect(await hydraChain.isWhitelisted(this.signers.validators[0].address)).to.be.equal(true);
      expect(await hydraChain.isWhitelisted(this.signers.validators[1].address)).to.be.equal(true);
    });

    it("should not whitelist a user that is already whitelisted", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(
        hydraChain
          .connect(this.signers.governance)
          .addToWhitelist([this.signers.validators[0].address, this.signers.validators[1].address])
      ).to.not.be.reverted;

      await expect(
        hydraChain
          .connect(this.signers.governance)
          .addToWhitelist([this.signers.validators[0].address, this.signers.validators[1].address])
      ).to.be.revertedWithCustomError(hydraChain, "PreviouslyWhitelisted");
    });

    it("should be able to remove from whitelist", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(
        hydraChain
          .connect(this.signers.governance)
          .addToWhitelist([this.signers.validators[1].address, this.signers.validators[3].address])
      ).to.not.be.reverted;

      await expect(
        hydraChain.connect(this.signers.governance).removeFromWhitelist([this.signers.validators[3].address])
      ).to.not.be.reverted;

      expect(await hydraChain.isWhitelisted(this.signers.validators[3].address)).to.be.equal(false);

      expect(await hydraChain.isWhitelisted(this.signers.validators[1].address)).to.be.equal(true);
    });

    it("should revert if we remove from whitelist twice", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(
        hydraChain
          .connect(this.signers.governance)
          .addToWhitelist([this.signers.validators[1].address, this.signers.validators[3].address])
      ).to.not.be.reverted;

      await expect(
        hydraChain.connect(this.signers.governance).removeFromWhitelist([this.signers.validators[3].address])
      ).to.not.be.reverted;

      await expect(
        hydraChain.connect(this.signers.governance).removeFromWhitelist([this.signers.validators[3].address])
      ).to.be.revertedWithCustomError(hydraChain, "MustBeWhitelisted");

      expect(await hydraChain.isWhitelisted(this.signers.validators[3].address)).to.be.equal(false);
    });
  });
}
