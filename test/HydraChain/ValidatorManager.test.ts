/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

import * as mcl from "../../ts/mcl";
import { CHAIN_ID, DOMAIN, ERRORS, VALIDATOR_STATUS, MAX_ACTIVE_VALIDATORS } from "../constants";

export function RunValidatorManagerTests(): void {
  describe("Validator counters", function () {
    it("should get all validators - admin", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      expect(await hydraChain.getValidators()).to.deep.equal([this.signers.admin.address]);
    });

    it("should get active validators count - the admin", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.deep.equal(1);
    });

    it("should revert when activating validator from non-HydraStaking contract", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.accounts[1]).activateValidator(this.signers.accounts[1].address))
        .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.onlyHydraStakingArg);
    });

    it("should revert when deactivating validator from non-HydraStaking contract", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.accounts[1]).deactivateValidator(this.signers.accounts[1].address))
        .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.onlyHydraStakingArg);
    });

    it("should revert if we try activate more than Max Active Validators", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      await hydraStaking.connect(this.signers.validators[2]).stake({ value: this.minStake.mul(2) });
      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(4);

      const keyPair = mcl.newKeyPair();
      const provider = hre.ethers.provider;
      const initialBalance = hre.ethers.utils.parseEther("100000");

      // * Whitelist & Register total max active validators validators
      for (let i = 4; i < MAX_ACTIVE_VALIDATORS; i++) {
        // create a new wallet
        const wallet = hre.ethers.Wallet.createRandom();
        const connectedWallet = wallet.connect(provider);
        // send eth to wallet
        await hre.network.provider.send("hardhat_setBalance", [
          wallet.address,
          initialBalance.toHexString().replace(/^0x0+/, "0x"),
        ]);
        // whitelist, register & stake
        await hydraChain.connect(this.signers.governance).addToWhitelist([wallet.address]);
        const signature = mcl.signValidatorMessage(DOMAIN, CHAIN_ID, wallet.address, keyPair.secret).signature;
        await hydraChain.connect(connectedWallet).register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey));

        await hydraStaking.connect(connectedWallet).stake({ value: this.minStake });
      }
      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(MAX_ACTIVE_VALIDATORS);

      // * Try to stake with more than max active validators
      const validator151Wallet = hre.ethers.Wallet.createRandom();
      const validator151 = validator151Wallet.connect(provider);
      await hre.network.provider.send("hardhat_setBalance", [
        validator151Wallet.address,
        initialBalance.toHexString().replace(/^0x0+/, "0x"),
      ]);
      await hydraChain.connect(this.signers.governance).addToWhitelist([validator151Wallet.address]);
      const signature = mcl.signValidatorMessage(
        DOMAIN,
        CHAIN_ID,
        validator151Wallet.address,
        keyPair.secret
      ).signature;
      await expect(
        hydraChain
          .connect(validator151)
          .register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey), { gasLimit: 1000000 })
      ).to.be.not.be.reverted;
      await expect(
        hydraStaking.connect(validator151).stake({ value: this.minStake, gasLimit: 1000000 })
      ).to.be.revertedWithCustomError(hydraChain, "MaxValidatorsReached");
    });

    it("should decrement the count of active validators when a validator is banned", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(3);

      await hydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);
    });

    it("should decrement the count of active validators when a validator unstake all his stake", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(3);

      await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake.mul(2));

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);
    });

    it("should decrement the count of active validators, when unstake all, even if we have delegation", async function () {
      const { hydraChain, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.stakedValidatorsStateFixture
      );

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(3);

      await hydraDelegation
        .connect(this.signers.delegator)
        .delegate(this.signers.validators[1].address, { value: this.minDelegation });

      await hydraStaking.connect(this.signers.validators[1]).unstake(this.minStake.mul(2));

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);

      await hydraDelegation
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[1].address, this.minDelegation);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);
    });

    it("should not decrement the count of active validators on ban, if user already unstaked all", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(3);

      await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake.mul(2));

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);

      await hydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);
    });
  });

  describe("Register", function () {
    it("should be able to register only whitelisted", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      await expect(
        hydraChain.connect(this.signers.accounts[10]).register([0, 0], [0, 0, 0, 0])
      ).to.be.revertedWithCustomError(hydraChain, "MustBeWhitelisted");
    });

    it("should not be able to register with invalid signature", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      const keyPair = mcl.newKeyPair();
      const signature = mcl.signValidatorMessage(
        DOMAIN,
        CHAIN_ID,
        this.signers.accounts[10].address,
        keyPair.secret
      ).signature;

      await expect(
        hydraChain.connect(this.signers.validators[1]).register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey))
      )
        .to.be.revertedWithCustomError(hydraChain, "InvalidSignature")
        .withArgs(this.signers.validators[1].address);
    });

    it("should register", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      expect(await hydraChain.isWhitelisted(this.signers.validators[0].address), "isWhitelisted").to.be.equal(true);

      const keyPair = mcl.newKeyPair();
      const signature = mcl.signValidatorMessage(
        DOMAIN,
        CHAIN_ID,
        this.signers.validators[0].address,
        keyPair.secret
      ).signature;

      const tx = await hydraChain
        .connect(this.signers.validators[0])
        .register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey));

      await expect(tx, "emit NewValidator")
        .to.emit(hydraChain, "NewValidator")
        .withArgs(
          this.signers.validators[0].address,
          mcl.g2ToHex(keyPair.pubkey).map((x) => hre.ethers.BigNumber.from(x))
        );

      expect(
        (await hydraChain.validators(this.signers.validators[0].address)).status,
        "status = Registered"
      ).to.be.equal(VALIDATOR_STATUS.Registered);
      const validator = await hydraChain.getValidator(this.signers.validators[0].address);

      expect(validator.stake, "stake").to.equal(0);
      expect(validator.totalStake, "total stake").to.equal(0);
      expect(validator.commission, "commission").to.equal(0);
      expect(validator.active, "active").to.equal(false);
      expect(
        validator.blsKey.map((x: any) => x.toHexString()),
        "blsKey"
      ).to.deep.equal(mcl.g2ToHex(keyPair.pubkey));
    });

    it("should revert when attempt to register twice", async function () {
      // * Only the first two validators are being registered
      const { hydraChain } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

      expect(
        (await hydraChain.validators(this.signers.validators[0].address)).status,
        "status = Registered"
      ).to.be.equal(VALIDATOR_STATUS.Registered);

      const keyPair = mcl.newKeyPair();
      const signature = mcl.signValidatorMessage(
        DOMAIN,
        CHAIN_ID,
        this.signers.validators[0].address,
        keyPair.secret
      ).signature;

      await expect(
        hydraChain.connect(this.signers.validators[0]).register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey)),
        "register"
      )
        .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
        .withArgs("ALREADY_REGISTERED");
    });

    it("should revert when trying to register active validator", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      expect(await hydraChain.isValidatorActive(this.signers.validators[0].address)).to.be.equal(true);

      const keyPair = mcl.newKeyPair();
      const signature = mcl.signValidatorMessage(
        DOMAIN,
        CHAIN_ID,
        this.signers.validators[0].address,
        keyPair.secret
      ).signature;

      await expect(
        hydraChain.connect(this.signers.validators[0]).register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey)),
        "register"
      )
        .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
        .withArgs("ALREADY_REGISTERED");
    });

    it("should revert when trying to register banned validator", async function () {
      const { hydraChain, bannedValidator } = await loadFixture(this.fixtures.bannedValidatorFixture);

      expect(await hydraChain.isValidatorBanned(bannedValidator.address)).to.be.equal(true);

      const keyPair = mcl.newKeyPair();
      const signature = mcl.signValidatorMessage(DOMAIN, CHAIN_ID, bannedValidator.address, keyPair.secret).signature;

      await expect(
        hydraChain.connect(bannedValidator).register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey)),
        "register"
      )
        .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
        .withArgs("ALREADY_REGISTERED");
    });
  });

  describe("Power Exponent", function () {
    it("should revert trying to update the Exponent if we are no-govern address", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.updateExponent(6000)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert trying to update the Exponent invalid small value", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.governance).updateExponent(4999)).to.be.revertedWithCustomError(
        hydraChain,
        "InvalidPowerExponent"
      );
    });

    it("should revert trying to update the Exponent with invalid big value", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.governance).updateExponent(10001)).to.be.revertedWithCustomError(
        hydraChain,
        "InvalidPowerExponent"
      );
    });

    it("should update the Exponent", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      expect(await hydraChain.powerExponent(), "powerExp before update").to.equal(5000);

      await hydraChain.connect(this.signers.governance).updateExponent(6000);

      expect(await hydraChain.powerExponent(), "powerExp after update").to.equal(6000);
    });
  });
}
