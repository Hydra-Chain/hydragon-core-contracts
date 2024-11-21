/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import * as mcl from "../../ts/mcl";
import { CHAIN_ID, DOMAIN, ERRORS } from "../constants";

export function RunWhitelistingTests(): void {
  describe("Whitelist", function () {
    it("should be modified only by the governance", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(
        hydraChain.connect(this.signers.validators[0]).addToWhitelist([this.signers.validators[0].address]),
        "addToWhitelist"
      )
        .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.governanceArg);

      await expect(
        hydraChain.connect(this.signers.validators[0]).removeFromWhitelist([this.signers.validators[0].address]),
        "removeFromWhitelist"
      )
        .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.governanceArg);
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

    describe("Enable and Disable Whitelisting", function () {
      it("enable should be modified only by the governance", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.validators[0]).enableWhitelisting(), "enableWhitelisting")
          .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.governanceArg);
      });

      it("disable should be modified only by the governance", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.validators[0]).disableWhitelisting(), "disableWhitelisting")
          .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.governanceArg);
      });

      it("should not be able to enable whitelisting if it is already enabled", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.governance).enableWhitelisting()).to.be.revertedWithCustomError(
          hydraChain,
          "WhitelistingAlreadyEnabled"
        );
      });

      it("should be able to disable whitelisting", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.governance).disableWhitelisting()).to.not.be.reverted;

        expect(await hydraChain.isWhitelistingEnabled()).to.be.equal(false);
      });

      it("should not be able to enable whitelisting if it is already disabled", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.governance).disableWhitelisting()).to.not.be.reverted;

        await expect(hydraChain.connect(this.signers.governance).enableWhitelisting()).to.not.be.reverted;

        expect(await hydraChain.isWhitelistingEnabled()).to.be.equal(true);
      });

      it("should not be able to disable whitelisting if it is already disabled", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.governance).disableWhitelisting()).to.not.be.reverted;

        await expect(hydraChain.connect(this.signers.governance).disableWhitelisting()).to.be.revertedWithCustomError(
          hydraChain,
          "WhitelistingAlreadyDisabled"
        );
      });

      it("should be not able to register user that is not whitelisted if whitelisting is enabled", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        expect(await hydraChain.isWhitelistingEnabled()).to.be.equal(true);

        await expect(
          hydraChain.connect(this.signers.delegator).register([0, 0], [0, 0, 0, 0])
        ).to.be.revertedWithCustomError(hydraChain, "MustBeWhitelisted");
      });

      it("should be able to register anyone if whitelisting is disabled", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.governance).disableWhitelisting()).to.not.be.reverted;

        expect(await hydraChain.isWhitelistingEnabled()).to.be.equal(false);

        const keyPair = mcl.newKeyPair();
        const signature = mcl.signValidatorMessage(
          DOMAIN,
          CHAIN_ID,
          this.signers.delegator.address,
          keyPair.secret
        ).signature;

        await expect(
          hydraChain.connect(this.signers.delegator).register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey)),
          "register"
        ).to.not.be.reverted;
      });
    });
  });
}
