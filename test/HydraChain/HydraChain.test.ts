/* eslint-disable node/no-extraneous-import */
import { loadFixture, setBalance, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

import * as mcl from "../../ts/mcl";
import {
  CHAIN_ID,
  DOMAIN,
  ERRORS,
  MAX_COMMISSION,
  VALIDATOR_STATUS,
  WEEK,
  DEADLINE,
  INITIAL_COMMISSION,
} from "../constants";
import { commitEpoch, getPermitSignature } from "../helper";
import { RunSwapVestedPositionValidatorTests } from "./SwapVestedPositionValidator.test";
import { RunDelegationTests } from "./Delegation.test";
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

      // sami: Should be in HydraDelegation
      it("should revert when initialize with invalid commission", async function () {
        const { hydraChain, hydraDelegation, liquidToken, hydraStaking, aprCalculator, vestingManagerFactory } =
          await loadFixture(this.fixtures.presetHydraChainStateFixture);

        const exceededCommission = MAX_COMMISSION.add(1);

        await expect(
          hydraDelegation.connect(this.signers.system).initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            exceededCommission,
            liquidToken.address,
            this.signers.governance.address,
            aprCalculator.address,
            hydraStaking.address,
            hydraChain.address,
            vestingManagerFactory.address
          )
        )
          .to.be.revertedWithCustomError(hydraDelegation, "InvalidCommission")
          .withArgs(exceededCommission);
      });

      // sami: Should be in HydraStaking
      it("should have zero staked & total supply", async function () {
        const { hydraStaking, hydraDelegation, hydraChain, liquidToken, aprCalculator } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );
        expect(await hydraStaking.totalStake(), "totalStake").to.equal(0);

        // initialize: because we make external calls to the HydraDelegation, which is set into the initializer (we pass no stakers)
        await hydraStaking
          .connect(this.signers.system)
          .initialize(
            [],
            this.minStake,
            liquidToken.address,
            hydraChain.address,
            aprCalculator.address,
            this.signers.governance.address,
            hydraDelegation.address
          );

        expect(await hydraStaking.totalBalance(), "totalSupply").to.equal(0);
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
    // sami: should be in stake contract
    describe("StakeSyncer", function () {
      describe("Stake", function () {
        it("should emit Staked event on stake", async function () {
          const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);
          const validatorHydraStaking = hydraStaking.connect(this.signers.validators[0]);

          await expect(validatorHydraStaking.stake({ value: this.minStake }), "emit Staked")
            .to.emit(hydraStaking, "Staked")
            .withArgs(this.signers.validators[0].address, this.minStake);

          // ensure proper staked amount is fetched
          const validatorData = await hydraChain.getValidator(this.signers.validators[0].address);
          expect(validatorData.stake, "stake").to.equal(this.minStake);
        });

        it("should emit Staked event on opening a vested position", async function () {
          const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

          const validator = this.signers.validators[1];
          const validatorHydraStaking = hydraStaking.connect(validator);
          const vestingDuration = 12; // weeks
          await expect(validatorHydraStaking.stakeWithVesting(vestingDuration, { value: this.minStake }), "emit Staked")
            .to.emit(hydraStaking, "Staked")
            .withArgs(validator.address, this.minStake);

          // ensure proper staked amount is fetched
          const validatorData = await hydraChain.getValidator(validator.address);
          expect(validatorData.stake, "stake").to.equal(this.minStake);
        });

        it("should emit Unstaked event on unstake", async function () {
          const { hydraChain, systemHydraChain, hydraStaking } = await loadFixture(
            this.fixtures.registeredValidatorsStateFixture
          );

          const validator = this.signers.validators[0];
          const validatorHydraStaking = hydraStaking.connect(validator);
          await validatorHydraStaking.stake({ value: this.minStake });
          await commitEpoch(
            systemHydraChain,
            hydraStaking,
            [validator, this.signers.validators[1], this.signers.validators[2]],
            this.epochSize
          );

          await expect(validatorHydraStaking.unstake(this.minStake), "emit Unstaked")
            .to.emit(hydraStaking, "Unstaked")
            .withArgs(validator.address, this.minStake);

          // ensure that the amount is properly unstaked
          const validatorData = await hydraChain.getValidator(validator.address);
          expect(validatorData.stake, "stake").to.equal(0);
        });

        it("should emit Unstaked event on unstake from vested position", async function () {
          const { hydraChain, systemHydraChain, hydraStaking } = await loadFixture(
            this.fixtures.registeredValidatorsStateFixture
          );

          const validator = this.signers.validators[0];
          const validatorHydraStaking = hydraStaking.connect(validator);
          const vestingDuration = 12; // weeks
          const stakeAmount = this.minStake.mul(2);
          await validatorHydraStaking.stakeWithVesting(vestingDuration, { value: stakeAmount });
          await commitEpoch(
            systemHydraChain,
            hydraStaking,
            [validator, this.signers.validators[1], this.signers.validators[2]],
            this.epochSize
          );

          const unstakeAmount = this.minStake.div(3);
          await expect(validatorHydraStaking.unstake(unstakeAmount), "emit Unstaked")
            .to.emit(hydraStaking, "Unstaked")
            .withArgs(validator.address, unstakeAmount);

          // ensure proper staked amount is fetched
          const validatorData = await hydraChain.getValidator(validator.address);
          expect(validatorData.stake, "stake").to.equal(stakeAmount.sub(unstakeAmount));
        });
      });

      // sami: should be in delegation contract
      describe("Delegation", () => {
        it("should emit Delegated event on delegate", async function () {
          const { hydraChain, hydraDelegation } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

          const validator = this.signers.validators[0];
          const { totalStake } = await hydraChain.getValidator(validator.address);

          const delegatorHydraDelegation = hydraDelegation.connect(this.signers.delegator);
          await expect(
            delegatorHydraDelegation.delegate(validator.address, { value: this.minDelegation }),
            "emit Delegated"
          )
            .to.emit(hydraDelegation, "Delegated")
            .withArgs(validator.address, this.signers.delegator.address, this.minDelegation);

          // to ensure that delegate is immediately applied on the validator stake
          expect((await hydraChain.getValidator(validator.address)).totalStake).to.equal(
            totalStake.add(this.minDelegation),
            "totalStake"
          );
        });

        it("should emit Delegated event on open vested position", async function () {
          const { hydraChain, vestManager, hydraDelegation } = await loadFixture(this.fixtures.vestManagerFixture);

          const validator = this.signers.validators[0];
          const { totalStake } = await hydraChain.getValidator(validator.address);

          const vestingDuration = 12; // weeks

          await expect(
            vestManager.openVestedDelegatePosition(validator.address, vestingDuration, { value: this.minDelegation }),
            "emit Delegated"
          )
            .to.emit(hydraDelegation, "Delegated")
            .withArgs(validator.address, vestManager.address, this.minDelegation);

          // to ensure that delegate is immediately applied on the validator stake
          expect((await hydraChain.getValidator(validator.address)).totalStake, "totalStake").to.equal(
            totalStake.add(this.minDelegation)
          );
        });

        it("should emit Delegated & Undelegated & PositionSwapped on vested delegation position swap", async function () {
          const { systemHydraChain, hydraStaking, vestManager, vestManagerOwner, liquidToken, hydraDelegation } =
            await loadFixture(this.fixtures.vestManagerFixture);

          const validator = this.signers.validators[0];
          const newValidator = this.signers.validators[1];

          const vestingDuration = 2; // 2 weeks
          await vestManager.connect(vestManagerOwner).openVestedDelegatePosition(validator.address, vestingDuration, {
            value: this.minDelegation.mul(2),
          });

          await commitEpoch(systemHydraChain, hydraStaking, [validator, newValidator], this.epochSize);
          const delegatedAmount = await hydraDelegation.delegationOf(validator.address, vestManager.address);

          // give allowance & swap
          await liquidToken.connect(vestManagerOwner).approve(vestManager.address, delegatedAmount);
          const swapTx = await vestManager
            .connect(vestManagerOwner)
            .swapVestedPositionValidator(validator.address, newValidator.address);
          await expect(swapTx, "emit Delegated for the new validator")
            .to.emit(hydraDelegation, "Delegated")
            .withArgs(newValidator.address, vestManager.address, delegatedAmount);
          await expect(swapTx, "emit Undelegated for the old validator")
            .to.emit(hydraDelegation, "Undelegated")
            .withArgs(validator.address, vestManager.address, delegatedAmount);
          await expect(swapTx, "emit PositionSwapped")
            .to.emit(hydraDelegation, "PositionSwapped")
            .withArgs(vestManager.address, validator.address, newValidator.address, delegatedAmount);
        });

        it("should emit Undelegated event on undelegate", async function () {
          const { hydraChain, hydraDelegation } = await loadFixture(this.fixtures.vestManagerFixture);

          const validator = this.signers.validators[0];
          const delegatorHydraDelegation = hydraDelegation.connect(this.signers.delegator);
          await delegatorHydraDelegation.delegate(validator.address, { value: this.minDelegation });
          const { totalStake } = await hydraChain.getValidator(validator.address);

          await expect(
            await delegatorHydraDelegation.undelegate(validator.address, this.minDelegation),
            "emit Undelegated"
          )
            .to.emit(hydraDelegation, "Undelegated")
            .withArgs(validator.address, this.signers.delegator.address, this.minDelegation);

          // to ensure that undelegate is immediately applied on the validator stake
          expect((await hydraChain.getValidator(validator.address)).totalStake, "totalStake").to.equal(
            totalStake.sub(this.minDelegation)
          );
        });

        it("should emit Undelegated event on cut vested position", async function () {
          const {
            hydraChain,
            systemHydraChain,
            hydraStaking,
            liquidToken,
            vestManager,
            vestManagerOwner,
            hydraDelegation,
          } = await loadFixture(this.fixtures.vestManagerFixture);

          const validator = this.signers.validators[0];
          const vestingDuration = 12; // weeks
          await vestManager.openVestedDelegatePosition(validator.address, vestingDuration, {
            value: this.minDelegation,
          });
          // because balance change can be made only once per epoch when vested delegation position
          await commitEpoch(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.signers.validators[2]],
            this.epochSize
          );
          const { totalStake } = await hydraChain.getValidator(validator.address);

          await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
          await expect(vestManager.cutVestedDelegatePosition(validator.address, this.minDelegation), "emit Undelegated")
            .to.emit(hydraDelegation, "Undelegated")
            .withArgs(validator.address, vestManager.address, this.minDelegation);
          // to ensure that undelegate is immediately applied on the validator stake
          expect((await hydraChain.getValidator(validator.address)).totalStake, "totalStake").to.equal(
            totalStake.sub(this.minDelegation)
          );
        });

        it("should emit Undelegated event on cut vested position using permit", async function () {
          const {
            hydraChain,
            systemHydraChain,
            hydraStaking,
            liquidToken,
            vestManager,
            vestManagerOwner,
            hydraDelegation,
          } = await loadFixture(this.fixtures.vestManagerFixture);

          const validator = this.signers.validators[0];
          const vestingDuration = 12; // weeks
          await vestManager.openVestedDelegatePosition(validator.address, vestingDuration, {
            value: this.minDelegation,
          });
          // because balance change can be made only once per epoch when vested delegation position
          await commitEpoch(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.signers.validators[2]],
            this.epochSize
          );
          const { totalStake } = await hydraChain.getValidator(validator.address);
          const { v, r, s } = await getPermitSignature(
            vestManagerOwner,
            liquidToken,
            vestManager.address,
            this.minDelegation,
            DEADLINE
          );

          await expect(
            vestManager.cutVestedDelegatePositionWithPermit(validator.address, this.minDelegation, DEADLINE, v, r, s),
            "emit Undelegated"
          )
            .to.emit(hydraDelegation, "Undelegated")
            .withArgs(validator.address, vestManager.address, this.minDelegation);
          // to ensure that undelegate is immediately applied on the validator stake
          expect((await hydraChain.getValidator(validator.address)).totalStake, "totalStake").to.equal(
            totalStake.sub(this.minDelegation)
          );
        });
      });
    });

    // sami : it should be in staking contract or common
    describe("Withdraw", function () {
      it("should fail the withdrawal", async function () {
        const { hydraChain, unstakedValidator, hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

        const validator = await hydraChain.getValidator(unstakedValidator.address);
        const balanceAfterUnstake = this.minStake.mul(2).sub(this.minStake.div(2));
        expect(validator.stake, "validator stake").to.equal(balanceAfterUnstake);

        await setBalance(hydraStaking.address, 0);
        const balance = await hre.ethers.provider.getBalance(hydraStaking.address);
        expect(balance, "hydraStaking balance").to.equal(0);

        await expect(hydraStaking.connect(unstakedValidator).withdraw(unstakedValidator.address)).to.be.revertedWith(
          "WITHDRAWAL_FAILED"
        );
      });

      it("should fail the withdrawal before withdraw time passes", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        await expect(
          hydraStaking.connect(this.signers.validators[0]).withdraw(this.signers.validators[0].address)
        ).to.be.revertedWithCustomError(hydraStaking, "NoWithdrawalAvailable");
      });

      it("should give the right amount on view function with multiple stake", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

        // unstake second time same amount
        await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake.div(2));

        const withdrawable = await hydraStaking.withdrawable(this.signers.validators[0].address);
        const pending = await hydraStaking.pendingWithdrawals(this.signers.validators[0].address);

        expect(withdrawable).to.equal(this.minStake.div(2)).and.to.equal(pending);

        // increase time to pass the withdraw time for 2nd stake
        await time.increase(WEEK);

        const withdrawableAfter = await hydraStaking.withdrawable(this.signers.validators[0].address);
        const pendingAfter = await hydraStaking.pendingWithdrawals(this.signers.validators[0].address);

        expect(withdrawableAfter).to.equal(this.minStake);
        expect(pendingAfter).to.equal(0);

        // withdraw
        await expect(
          hydraStaking.connect(this.signers.validators[0]).withdraw(this.signers.validators[0].address)
        ).to.emit(hydraStaking, "WithdrawalFinished");

        const withdrawableAfterWithdraw = await hydraStaking.withdrawable(this.signers.validators[0].address);
        const pendingAfterWithdraw = await hydraStaking.pendingWithdrawals(this.signers.validators[0].address);

        expect(withdrawableAfterWithdraw).to.equal(0).and.to.equal(pendingAfterWithdraw);
      });

      it("should withdraw", async function () {
        const { unstakedValidator, unstakedAmount, hydraStaking } = await loadFixture(
          this.fixtures.withdrawableFixture
        );

        expect(await hydraStaking.connect(unstakedValidator).withdraw(unstakedValidator.address), "withdraw")
          .to.emit(hydraStaking, "WithdrawalFinished")
          .withArgs(hydraStaking.address, unstakedValidator.address, unstakedAmount);
        expect(await hydraStaking.pendingWithdrawals(unstakedValidator.address), "pendingWithdrawals").to.equal(0);
        expect(await hydraStaking.withdrawable(unstakedValidator.address), "withdrawable").to.equal(0);
      });

      it("should fail to update withdraw time if not governance", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

        await expect(
          hydraStaking.connect(this.signers.validators[0]).changeWithdrawalWaitPeriod(WEEK * 2)
        ).to.be.revertedWith(ERRORS.ownable);
      });

      it("should fail update withdraw time if we pass 0", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

        await expect(
          hydraStaking.connect(this.signers.governance).changeWithdrawalWaitPeriod(0)
        ).to.be.revertedWithCustomError(hydraStaking, "InvalidWaitPeriod");
      });

      it("should update withdraw time by governance account", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

        await hydraStaking.connect(this.signers.governance).changeWithdrawalWaitPeriod(WEEK * 2);
        const waitPeriod = await hydraStaking.withdrawWaitPeriod();
        expect(waitPeriod).to.be.equal(WEEK * 2);
      });
    });

    // sami: should be in delegation contract
    describe("Set Commission", function () {
      it("should revert when call setCommission for unregistered or inactive validator", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        await expect(hydraDelegation.connect(this.signers.validators[3]).setCommission(MAX_COMMISSION))
          .to.be.revertedWithCustomError(hydraDelegation, "InvalidStaker")
          .withArgs(this.signers.validators[3].address);
      });

      it("should revert with invalid commission", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        const exceededCommission = MAX_COMMISSION.add(1);

        await expect(hydraDelegation.connect(this.signers.validators[0]).setCommission(exceededCommission))
          .to.be.revertedWithCustomError(hydraDelegation, "InvalidCommission")
          .withArgs(exceededCommission);
      });

      it("should set commission", async function () {
        const { hydraChain, hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        // set commission and verify event
        const newCommission = MAX_COMMISSION.div(2);
        await expect(hydraDelegation.connect(this.signers.validators[0]).setCommission(newCommission))
          .to.emit(hydraDelegation, "CommissionUpdated")
          .withArgs(this.signers.validators[0].address, newCommission);

        // get the update validator and ensure that the new commission is set
        const validator = await hydraChain.getValidator(this.signers.validators[0].address);
        expect(validator.commission).to.equal(newCommission);
      });
    });

    describe("Inspector", function () {
      RunInspectorTests();
    });
    describe("Delegation", function () {
      RunDelegationTests();
    });
    describe("SwapVestedPosition", function () {
      RunSwapVestedPositionValidatorTests();
    });
  });
}
