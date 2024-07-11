/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

import * as mcl from "../../ts/mcl";
import { CHAIN_ID, DOMAIN, ERRORS, VALIDATOR_STATUS, INITIAL_COMMISSION } from "../constants";
import { RunInspectorTests } from "./Inspector.test";

export function RunHydraChainTests(): void {
  describe("", function () {
    // * Main tests for the ValidatorSet with the loaded context and all child fixtures
    describe("HydraChain initializations", function () {
      it("should validate default values when HydraChain deployed", async function () {
        const { hydraChain, hydraStaking, hydraDelegation } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

        expect(hydraChain.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await hydraStaking.minStake()).to.equal(0);
        expect(await hydraDelegation.minDelegation()).to.equal(0);
        expect(await hydraChain.currentEpochId()).to.equal(0);
        expect(await hydraChain.owner()).to.equal(hre.ethers.constants.AddressZero);
      });

      it("should revert when initialized without system call", async function () {
        const { hydraChain, bls, hydraStaking, hydraDelegation } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

        await expect(
          hydraChain.initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            hydraStaking.address,
            hydraDelegation.address,
            bls.address
          )
        )
          .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
          .withArgs("SYSTEMCALL");
      });

      it("should revert with invalid signature when initializing", async function () {
        const { systemHydraChain, bls, hydraStaking, hydraDelegation } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

        this.validatorSetSize = Math.floor(Math.random() * (5 - 1) + 5); // Randomly pick 5-9
        this.validatorStake = hre.ethers.utils.parseEther(String(Math.floor(Math.random() * (10000 - 1000) + 1000)));

        await expect(
          systemHydraChain.initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            hydraStaking.address,
            hydraDelegation.address,
            bls.address
          )
        )
          .to.be.revertedWithCustomError(systemHydraChain, "InvalidSignature")
          .withArgs(this.signers.accounts[1].address);
      });

      it("should initialize successfully", async function () {
        const { hydraChain, bls, hydraStaking, hydraDelegation, validatorInit } = await loadFixture(
          this.fixtures.initializedHydraChainStateFixture
        );

        expect(await hydraStaking.minStake(), "minStake").to.equal(this.minStake);
        expect(await hydraDelegation.minDelegation(), "minDelegation").to.equal(this.minDelegation);
        expect(await hydraChain.currentEpochId(), "currentEpochId").to.equal(1);
        expect(await hydraChain.owner(), "owner").to.equal(this.signers.governance.address);

        const adminAddress = this.signers.admin.address;
        const validator = await hydraChain.getValidator(adminAddress);

        expect(
          validator.blsKey.map((x: any) => x.toHexString()),
          "blsKey"
        ).to.deep.equal(validatorInit.pubkey);
        expect(await hydraStaking.stakeOf(adminAddress), "stakeOf").to.equal(this.minStake.mul(2));
        expect(await hydraDelegation.totalDelegationOf(adminAddress), "totalDelegationOf").to.equal(0);
        expect(validator.commission, "commission").to.equal(INITIAL_COMMISSION);
        expect(await hydraChain.bls(), "bls").to.equal(bls.address);
        expect(await hydraStaking.totalBalance(), "totalSupply").to.equal(this.minStake.mul(2));
      });

      it("should revert on reinitialization attempt", async function () {
        const { systemHydraChain, bls, hydraStaking, validatorInit, hydraDelegation } = await loadFixture(
          this.fixtures.initializedHydraChainStateFixture
        );

        await expect(
          systemHydraChain.initialize(
            [validatorInit],
            this.signers.governance.address,
            hydraStaking.address,
            hydraDelegation.address,
            bls.address
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("should revert when calling functions protected by onlyHydraStaking modifier", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.connect(this.signers.accounts[1]).activateValidator(this.signers.accounts[1].address))
          .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
          .withArgs("ONLY_HYDRA_STAKING");
        await expect(hydraChain.connect(this.signers.accounts[1]).deactivateValidator(this.signers.accounts[1].address))
          .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
          .withArgs("ONLY_HYDRA_STAKING");
      });
      // sami: for HydraDelegation
      it("should revert when calling functions protected by onlyHydraStaking modifier", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(
          hydraDelegation
            .connect(this.signers.accounts[1])
            .distributeDelegationRewards(this.signers.accounts[1].address, 1, 1)
        )
          .to.be.revertedWithCustomError(hydraDelegation, "Unauthorized")
          .withArgs("ONLY_HYDRA_STAKING");
      });
      // sami: for HydraStaking
      it("should revert when calling functions protected by onlyHydraChain modifier", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(
          hydraStaking.connect(this.signers.accounts[1]).penalizeStaker(this.signers.accounts[1].address, 1, [])
        )
          .to.be.revertedWithCustomError(hydraStaking, "Unauthorized")
          .withArgs("ONLY_HYDRA_CHAIN");
      });
    });

    describe("Voting Power Exponent", async () => {
      it("should have valid initialized values", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        const powerExp = await hydraChain.powerExponent();
        expect(powerExp.value, "powerExp.value").to.equal(5000);
        expect(powerExp.pendingValue, "powerExp.pendingValue").to.equal(0);

        const powerExpRes = await hydraChain.getExponent();
        expect(powerExpRes.numerator, "powerExpRes.numerator").to.equal(5000);
        expect(powerExpRes.denominator, "powerExpRes.denominator").to.equal(10000);
      });
    });

    it("should revert on commit epoch without system call", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime))
        .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
        .withArgs("SYSTEMCALL");
    });

    it("should revert with unexpected epoch id", async function () {
      const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
      const unexpectedEpochId = hre.ethers.utils.parseEther("1");

      await expect(
        systemHydraChain.commitEpoch(unexpectedEpochId, this.epoch, this.epochSize, this.uptime)
      ).to.be.revertedWith("UNEXPECTED_EPOCH_ID");
    });

    it("should revert with no blocks committed", async function () {
      const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      this.epoch.startBlock = hre.ethers.BigNumber.from(0);
      this.epoch.endBlock = hre.ethers.BigNumber.from(0);

      await expect(
        systemHydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime)
      ).to.be.revertedWith("NO_BLOCKS_COMMITTED");
    });

    it("should revert that epoch is not divisible by epochSize", async function () {
      const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      // * commitEpoch checks for (epoch.endBlock - epoch.startBlock + 1) % epochSize === 0
      this.epoch.startBlock = hre.ethers.BigNumber.from(1);
      this.epoch.endBlock = hre.ethers.BigNumber.from(63);

      await expect(
        systemHydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime)
      ).to.be.revertedWith("EPOCH_MUST_BE_DIVISIBLE_BY_EPOCH_SIZE");
    });

    it("should revert with invalid start block", async function () {
      const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      // * commitEpoch checks for (epoch.endBlock - epoch.startBlock + 1) % epochSize === 0
      this.epoch.startBlock = hre.ethers.BigNumber.from(3);
      this.epoch.endBlock = hre.ethers.BigNumber.from(64);
      this.epochSize = hre.ethers.BigNumber.from(62);

      await expect(
        systemHydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime)
      ).to.be.revertedWith("INVALID_START_BLOCK");
    });

    it("should commit epoch", async function () {
      this.epochId = hre.ethers.BigNumber.from(1);
      // * commitEpoch checks for (epoch.endBlock - epoch.startBlock + 1) % epochSize === 0
      this.epoch.startBlock = hre.ethers.BigNumber.from(1);
      this.epoch.endBlock = hre.ethers.BigNumber.from(64);
      this.epochSize = hre.ethers.BigNumber.from(64);
      this.epoch.epochRoot = hre.ethers.utils.randomBytes(32);

      const { systemHydraChain, commitEpochTx } = await loadFixture(this.fixtures.commitEpochTxFixture);

      await expect(commitEpochTx, "tx validation")
        .to.emit(systemHydraChain, "NewEpoch")
        .withArgs(
          this.epochId,
          this.epoch.startBlock,
          this.epoch.endBlock,
          hre.ethers.utils.hexlify(this.epoch.epochRoot)
        );

      const storedEpoch: any = await systemHydraChain.epochs(1);
      const currentEpochId = await systemHydraChain.currentEpochId();

      expect(storedEpoch.startBlock, "startBlock").to.equal(this.epoch.startBlock);
      expect(storedEpoch.endBlock, "endBlock").to.equal(this.epoch.endBlock);
      expect(storedEpoch.epochRoot, "epochRoot").to.equal(hre.ethers.utils.hexlify(this.epoch.epochRoot));
      expect(currentEpochId, "currentEpochId").to.equal(2);
    });

    it("should get all validators - admin", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      expect(await hydraChain.getValidators()).to.deep.equal([this.signers.admin.address]);
    });

    it("should get active validators count - the admin", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.deep.equal(1);
    });

    it("should revert if we try register more than 150 Validators", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
      await hydraStaking.connect(this.signers.validators[2]).stake({ value: this.minStake.mul(2) });
      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(4);

      const keyPair = mcl.newKeyPair();
      const provider = hre.ethers.provider;
      const initialBalance = hre.ethers.utils.parseEther("100000");

      // * Whitelist & Register total 150 validators
      for (let i = 4; i < 150; i++) {
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
      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(150);

      // * Try to stake with 151 validators
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

    it("should decrement the count of validators when a validator is banned", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(3);

      await hydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);
    });

    it("should decrement the count of validators when a validator unstake all his stake", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(3);

      await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake.mul(2));

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);
    });

    it("should decrement the count of validators, when unstake all, even if we have delegation", async function () {
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

    it("should not decrement the count of validators on ban, if user already unstaked all", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(3);

      await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake.mul(2));

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);

      await hydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address);

      expect(await hydraChain.getActiveValidatorsCount()).to.be.equal(2);
    });

    it("should get epoch by block", async function () {
      const { systemHydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      const storedEpoch = await systemHydraChain.getEpochByBlock(10);

      expect(storedEpoch.startBlock).to.equal(this.epoch.startBlock);
      expect(storedEpoch.endBlock).to.equal(this.epoch.endBlock);
      expect(storedEpoch.epochRoot).to.equal(hre.ethers.utils.hexlify(this.epoch.epochRoot));
    });

    it("should get non-existent epoch by block", async function () {
      const { systemHydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      const storedEpoch = await systemHydraChain.getEpochByBlock(128);

      expect(storedEpoch.startBlock).to.equal(hre.ethers.constants.Zero);
      expect(storedEpoch.endBlock).to.equal(hre.ethers.constants.Zero);
      expect(storedEpoch.epochRoot).to.equal(hre.ethers.constants.HashZero);
    });

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

    describe("Register", function () {
      it("should be able to register only whitelisted", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

        await expect(hydraChain.connect(this.signers.accounts[10]).register([0, 0], [0, 0, 0, 0]))
          .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
          .withArgs("WHITELIST");
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
    });

    describe("Inspector", function () {
      RunInspectorTests();
    });
  });
}
