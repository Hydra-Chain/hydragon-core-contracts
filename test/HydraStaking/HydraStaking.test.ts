/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { commitEpoch } from "../helper";
import { ERRORS, WEEK } from "../constants";
import { RunStakingTests } from "./Staking.test";
import { RunDelegatedStakingTests } from "./DelegatedStaking.test";
import { RunVestedStakingTests } from "./VestedStaking.test";

// TODO: Make an end-to-end test to cover full scenario with many different types of staking (non-vested, vested for different periods, banned, unstake before finish vesting, etc.) made for n validators and then all of them to dissapear. Check are the balances of hydra properly handled.

export function RunHydraStakingTests(): void {
  describe("", function () {
    describe("HydraStaking initializations", function () {
      it("should validate default values when HydraStaking deployed", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        expect(hydraStaking.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await hydraStaking.owner()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraStaking.minStake()).to.equal(0);
        expect(await hydraStaking.totalStake()).to.equal(0);
        expect(await hydraStaking.hydraChainContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraStaking.delegationContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraStaking.aprCalculatorContract()).to.equal(hre.ethers.constants.AddressZero);

        expect(await hydraStaking.MIN_STAKE_LIMIT()).to.equal(this.minStake);

        // Liquid Delegation
        expect(await hydraStaking.liquidToken()).to.equal(hre.ethers.constants.AddressZero);

        // Withdrawable
        expect(await hydraStaking.withdrawWaitPeriod()).to.equal(0);
      });

      it("should have zero total supply if we pass no validators", async function () {
        const { hydraStaking, hydraDelegation, hydraChain, liquidToken, aprCalculator, rewardWallet } =
          await loadFixture(this.fixtures.presetHydraChainStateFixture);

        // initialize: because we make external calls to the HydraDelegation, which is set into the initializer (we pass no stakers)
        await hydraStaking
          .connect(this.signers.system)
          .initialize(
            [],
            this.signers.governance.address,
            this.minStake,
            liquidToken.address,
            hydraChain.address,
            aprCalculator.address,
            hydraDelegation.address,
            rewardWallet.address
          );

        expect(await hydraStaking.totalBalance(), "totalSupply").to.equal(0);
      });

      it("should revert when initialized without system call", async function () {
        const { hydraChain, liquidToken, hydraStaking, hydraDelegation, aprCalculator, rewardWallet } =
          await loadFixture(this.fixtures.presetHydraChainStateFixture);

        await expect(
          hydraStaking.initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            this.minStake,
            liquidToken.address,
            hydraChain.address,
            aprCalculator.address,
            hydraDelegation.address,
            rewardWallet.address
          )
        )
          .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.systemCallArg);
      });

      it("should revert if minStake is too low", async function () {
        const { hydraStaking, hydraDelegation, hydraChain, liquidToken, aprCalculator, rewardWallet } =
          await loadFixture(this.fixtures.presetHydraChainStateFixture);

        await expect(
          hydraStaking.connect(this.signers.system).initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            0,
            liquidToken.address,
            hydraChain.address,
            aprCalculator.address,
            hydraDelegation.address,
            rewardWallet.address
          )
        ).to.be.revertedWithCustomError(hydraStaking, "InvalidMinStake");
      });

      it("should initialize successfully", async function () {
        const { hydraChain, hydraDelegation, liquidToken, hydraStaking, aprCalculator, rewardWallet } =
          await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        expect(await hydraStaking.owner(), "owner").to.equal(this.signers.governance.address);
        expect(await hydraStaking.minStake(), "minStake").to.equal(this.minStake);
        expect(await hydraStaking.totalStake(), "totalStake").to.equal(this.minStake.mul(2));
        expect(await hydraStaking.totalBalance(), "totalBalance").to.equal(this.minStake.mul(2));
        expect(await hydraStaking.hydraChainContract(), "hydraChainContract").to.equal(hydraChain.address);
        expect(await hydraStaking.delegationContract(), "delegationContract").to.equal(hydraDelegation.address);
        expect(await hydraStaking.aprCalculatorContract(), "aprCalculatorContract").to.equal(aprCalculator.address);
        expect(await hydraStaking.stakeOf(this.signers.admin.address), "stakeOf").to.equal(this.minStake.mul(2));
        expect(await hydraStaking.totalBalanceOf(this.signers.admin.address), "stakeOf").to.equal(this.minStake.mul(2));
        expect(
          await hydraDelegation.hasRole(await hydraDelegation.DEFAULT_ADMIN_ROLE(), this.signers.governance.address),
          "hasRole"
        ).to.be.true;

        // Liquid Delegation
        expect(await hydraStaking.liquidToken(), "liquidToken").to.equal(liquidToken.address);

        // Withdrawable
        expect(await hydraStaking.withdrawWaitPeriod(), "withdrawWaitPeriod").to.equal(WEEK);

        // Reward Wallet
        const rewardWalletInitialAmount = this.minStake.mul(5);
        expect(await hre.ethers.provider.getBalance(rewardWallet.address), "getBalance").to.be.eq(
          rewardWalletInitialAmount
        );
        expect(await rewardWallet.rewardManagers(hydraStaking.address), "hydraStaking").to.equal(true);
        expect(await rewardWallet.rewardManagers(hydraDelegation.address), "hydraDelegation").to.equal(true);
      });

      it("should revert on re-initialization attempt", async function () {
        const {
          hydraChain,
          hydraDelegation,
          liquidToken,
          hydraStaking,
          aprCalculator,
          vestingManagerFactory,
          rewardWallet,
        } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(
          hydraDelegation.connect(this.signers.system).initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            0,
            liquidToken.address,
            aprCalculator.address,
            hydraStaking.address,
            hydraChain.address,
            vestingManagerFactory.address,
            rewardWallet.address
          )
        ).to.be.revertedWith(ERRORS.initialized);
      });
    });

    describe("Total Balance", function () {
      it("should add up to Total Balance after delegation", async function () {
        const { hydraStaking, hydraDelegation } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        const totalBalance = await hydraStaking.totalBalance();

        await hydraDelegation
          .connect(this.signers.delegator)
          .delegate(this.signers.validators[0].address, { value: this.minDelegation });

        expect(await hydraStaking.totalBalance()).to.be.equal(totalBalance.add(this.minDelegation));
      });

      it("should add up to Total Balance after stake", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

        const totalBalance = await hydraStaking.totalBalance();

        await hydraStaking.connect(this.signers.validators[0]).stake({ value: this.minStake });

        expect(await hydraStaking.totalBalance()).to.be.equal(totalBalance.add(this.minStake));
      });

      it("should reduce to Total Balance after undelegate", async function () {
        const { hydraStaking, hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        const totalBalance = await hydraStaking.totalBalance();

        await hydraDelegation
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, this.minStake);

        expect(await hydraStaking.totalBalance()).to.be.equal(totalBalance.sub(this.minStake));
      });

      it("should reduce to Total Balance after unstake", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        const totalBalance = await hydraStaking.totalBalance();

        await hydraStaking.connect(this.signers.validators[0]).unstake(this.minStake);

        expect(await hydraStaking.totalBalance()).to.be.equal(totalBalance.sub(this.minStake));
      });
    });

    describe("Change minStake", function () {
      it("should revert if non-Govern address try to change min stake", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

        await expect(hydraStaking.connect(this.signers.validators[0]).changeMinStake(this.minStake)).to.be.revertedWith(
          ERRORS.ownable
        );
      });

      it("should revert if minStake is too low", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

        const newMinStakeLow = this.minStake.div(2);

        await expect(
          hydraStaking.connect(this.signers.governance).changeMinStake(newMinStakeLow)
        ).to.be.revertedWithCustomError(hydraStaking, "InvalidMinStake");

        expect(await hydraStaking.minStake()).to.be.equal(this.minStake);
      });

      it("should change min stake by Govern address", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

        const newMinStake = this.minStake.mul(2);

        await expect(hydraStaking.connect(this.signers.governance).changeMinStake(newMinStake)).to.not.be.reverted;

        expect(await hydraStaking.minStake()).to.be.equal(newMinStake);
      });
    });

    // TODO: add some more coverage here, like in the HydraDelegation's claim rewards
    describe("Claim Rewards", function () {
      it("should claim validator reward", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        const rewardingValidator = this.signers.validators[0];

        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [rewardingValidator, this.signers.validators[1]],
          this.epochSize
        );

        const reward = await hydraStaking.unclaimedRewards(rewardingValidator.address);
        const tx = await hydraStaking.connect(rewardingValidator)["claimStakingRewards()"]();
        const receipt = await tx.wait();

        const event = receipt.events?.find((log: any) => log.event === "StakingRewardsClaimed");
        expect(event?.args?.account, "event.arg.account").to.equal(rewardingValidator.address);
        expect(event?.args?.amount, "event.arg.amount").to.equal(reward);

        await expect(tx, "StakingRewardsClaimed")
          .to.emit(hydraStaking, "StakingRewardsClaimed")
          .withArgs(rewardingValidator.address, reward);
      });
    });

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
    });

    describe("Staking", function () {
      RunStakingTests();
    });
    describe("DelegatedStaking", function () {
      RunDelegatedStakingTests();
    });
    describe("VestedStaking", function () {
      RunVestedStakingTests();
    });
  });
}
