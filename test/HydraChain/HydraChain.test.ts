/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

import { ERRORS, INITIAL_COMMISSION, MAX_ACTIVE_VALIDATORS } from "../constants";
import { RunInspectorTests } from "./Inspector.test";
import { RunWhitelistingTests } from "./Whitelisting.test";
import { RunValidatorManagerTests } from "./ValidatorManager.test";
import { RunDaoIncentiveTests } from "./DaoIncentive.test";
import { RunValidatorsDataTests } from "./ValidatrosData.test";

export function RunHydraChainTests(): void {
  describe("", function () {
    describe("HydraChain initializations", function () {
      it("should validate default values when HydraChain deployed", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        expect(hydraChain.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await hydraChain.currentEpochId()).to.equal(0);
        expect(
          await hydraChain.hasRole(await hydraChain.DEFAULT_ADMIN_ROLE(), this.signers.governance.address),
          "hasRole"
        ).to.be.false;

        // Whitelisting
        expect(await hydraChain.isWhitelistingEnabled()).to.be.false;

        // DaoIncentive
        expect(await hydraChain.hydraStakingContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraChain.aprCalculatorContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraChain.rewardWalletContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraChain.daoIncentiveVaultAddr()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraChain.vaultDistribution()).to.equal(0);

        // Validator Manager
        expect(await hydraChain.bls()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraChain.hydraStakingContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraChain.hydraDelegationContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraChain.activeValidatorsCount()).to.equal(0);
        expect(await hydraChain.getValidators()).to.deep.equal([]);

        expect(await hydraChain.MAX_VALIDATORS()).to.equal(MAX_ACTIVE_VALIDATORS);
        expect(await hydraChain.DOMAIN()).to.equal(
          hre.ethers.utils.solidityKeccak256(["string"], ["DOMAIN_HYDRA_CHAIN"])
        );

        // Power Exponent
        const powerExp = await hydraChain.powerExponent();
        expect(powerExp, "powerExponent").to.equal(0);

        // Inspector
        expect(await hydraChain.validatorPenalty()).to.equal(0);
        expect(await hydraChain.reporterReward()).to.equal(0);
        expect(await hydraChain.banThreshold()).to.equal(0);
      });

      it("should revert when initialized without system call", async function () {
        const { hydraChain, bls, hydraStaking, hydraDelegation, aprCalculator, rewardWallet, DAOIncentiveVault } =
          await loadFixture(this.fixtures.presetHydraChainStateFixture);

        await expect(
          hydraChain.initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            hydraStaking.address,
            hydraDelegation.address,
            aprCalculator.address,
            rewardWallet.address,
            DAOIncentiveVault.address,
            bls.address
          )
        )
          .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.systemCallArg);
      });

      it("should revert with invalid signature when initializing", async function () {
        const { systemHydraChain, bls, hydraStaking, hydraDelegation, aprCalculator, rewardWallet, DAOIncentiveVault } =
          await loadFixture(this.fixtures.presetHydraChainStateFixture);

        this.validatorSetSize = Math.floor(Math.random() * (5 - 1) + 5); // Randomly pick 5-9
        this.validatorStake = hre.ethers.utils.parseEther(String(Math.floor(Math.random() * (10000 - 1000) + 1000)));

        await expect(
          systemHydraChain.initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            hydraStaking.address,
            hydraDelegation.address,
            aprCalculator.address,
            rewardWallet.address,
            DAOIncentiveVault.address,
            bls.address
          )
        )
          .to.be.revertedWithCustomError(systemHydraChain, "InvalidSignature")
          .withArgs(this.signers.accounts[1].address);
      });

      it("should initialize successfully", async function () {
        const {
          hydraChain,
          bls,
          hydraStaking,
          hydraDelegation,
          validatorInit,
          aprCalculator,
          rewardWallet,
          DAOIncentiveVault,
        } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const adminAddress = this.signers.admin.address;
        const validator = await hydraChain.getValidator(adminAddress);

        expect(await hydraChain.currentEpochId(), "currentEpochId").to.equal(1);
        expect(
          await hydraDelegation.hasRole(await hydraDelegation.DEFAULT_ADMIN_ROLE(), this.signers.governance.address)
        ).to.be.true;

        // Whitelisting
        expect(await hydraChain.isWhitelistingEnabled()).to.be.true;

        // DaoIncentive
        expect(await hydraChain.hydraStakingContract()).to.equal(hydraStaking.address);
        expect(await hydraChain.aprCalculatorContract()).to.equal(aprCalculator.address);
        expect(await hydraChain.rewardWalletContract()).to.equal(rewardWallet.address);
        expect(await hydraChain.daoIncentiveVaultAddr()).to.equal(DAOIncentiveVault.address);
        expect(await hydraChain.lastDistribution()).to.not.equal(0);

        // Validator Manager
        expect(await hydraChain.bls()).to.equal(bls.address);
        expect(await hydraChain.hydraStakingContract()).to.equal(hydraStaking.address);
        expect(await hydraChain.hydraDelegationContract()).to.equal(hydraDelegation.address);
        expect(await hydraChain.activeValidatorsCount()).to.equal(1);
        expect(await hydraChain.getValidators()).to.deep.equal([this.signers.admin.address]);
        expect(validator.commission, "commission").to.equal(INITIAL_COMMISSION);
        expect(await hydraChain.bls(), "bls").to.equal(bls.address);
        expect(
          validator.blsKey.map((x: any) => x.toHexString()),
          "blsKey"
        ).to.deep.equal(validatorInit.pubkey);

        // Power Exponent
        const powerExp = await hydraChain.powerExponent();
        expect(powerExp, "powerExponent").to.equal(5000); // power exponent = 0.5

        // Inspector
        expect(await hydraChain.validatorPenalty()).to.equal(hre.ethers.utils.parseEther("700"));
        expect(await hydraChain.reporterReward()).to.equal(hre.ethers.utils.parseEther("300"));
        expect(await hydraChain.initiateBanThreshold()).to.equal(18000);
        expect(await hydraChain.banThreshold()).to.equal(60 * 60 * 24);
      });

      it("should revert on re-initialization attempt", async function () {
        const {
          systemHydraChain,
          bls,
          hydraStaking,
          validatorInit,
          hydraDelegation,
          aprCalculator,
          rewardWallet,
          DAOIncentiveVault,
        } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(
          systemHydraChain.initialize(
            [validatorInit],
            this.signers.governance.address,
            hydraStaking.address,
            hydraDelegation.address,
            aprCalculator.address,
            rewardWallet.address,
            DAOIncentiveVault.address,
            bls.address
          )
        ).to.be.revertedWith(ERRORS.initialized);
      });
    });

    describe("Epoch", function () {
      it("should revert on commit epoch without system call", async function () {
        const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime))
          .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.systemCallArg);
      });

      it("should revert with unexpected epoch id", async function () {
        const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
        const unexpectedEpochId = hre.ethers.utils.parseEther("1");

        await expect(systemHydraChain.commitEpoch(unexpectedEpochId, this.epoch, this.epochSize, this.uptime))
          .to.be.revertedWithCustomError(systemHydraChain, "CommitEpochFailed")
          .withArgs("UNEXPECTED_EPOCH_ID");
      });

      it("should revert with no blocks committed", async function () {
        const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        this.epoch.startBlock = hre.ethers.BigNumber.from(0);
        this.epoch.endBlock = hre.ethers.BigNumber.from(0);

        await expect(systemHydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime))
          .to.be.revertedWithCustomError(systemHydraChain, "CommitEpochFailed")
          .withArgs("NO_BLOCKS_COMMITTED");
      });

      it("should revert that epoch is not divisible by epochSize", async function () {
        const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        // * commitEpoch checks for (epoch.endBlock - epoch.startBlock + 1) % epochSize === 0
        this.epoch.startBlock = hre.ethers.BigNumber.from(1);
        this.epoch.endBlock = hre.ethers.BigNumber.from(63);

        await expect(systemHydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime))
          .to.be.revertedWithCustomError(systemHydraChain, "CommitEpochFailed")
          .withArgs("EPOCH_MUST_BE_DIVISIBLE_BY_EPOCH_SIZE");
      });

      it("should revert with invalid start block", async function () {
        const { systemHydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        // * commitEpoch checks for (epoch.endBlock - epoch.startBlock + 1) % epochSize === 0
        this.epoch.startBlock = hre.ethers.BigNumber.from(3);
        this.epoch.endBlock = hre.ethers.BigNumber.from(64);
        this.epochSize = hre.ethers.BigNumber.from(62);

        await expect(systemHydraChain.commitEpoch(this.epochId, this.epoch, this.epochSize, this.uptime))
          .to.be.revertedWithCustomError(systemHydraChain, "CommitEpochFailed")
          .withArgs("INVALID_START_BLOCK");
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
    });

    describe("Whitelisting", function () {
      RunWhitelistingTests();
    });
    describe("Dao Incentive", function () {
      RunDaoIncentiveTests();
    });
    describe("Inspector", function () {
      RunInspectorTests();
    });
    describe("Validator Manager", function () {
      RunValidatorManagerTests();
    });
    describe("Validators Data", function () {
      RunValidatorsDataTests();
    });
  });
}
