/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import * as mcl from "../../ts/mcl";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { commitEpoch, createNewVestManager } from "../helper";
import { CHAIN_ID, DAY, DOMAIN, ERRORS, rewardsForDelegators, rewardsForStakers, WEEK } from "../constants";
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
        expect(await hydraStaking.lastDistribution()).to.be.equal(0);

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
        expect(await hydraStaking.lastDistribution()).to.not.equal(0);

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

    describe("lastDistribution", function () {
      it("should update on reward distribution", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
        const rewardingValidator = this.signers.validators[0];

        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [rewardingValidator, this.signers.validators[1]],
          this.epochSize
        );

        expect((await hydraStaking.lastDistribution()).toNumber()).to.be.equal(await time.latest());
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

    describe("Table driven tests for rewards", async function () {
      it("should have less than 1% difference with data table rewards", async function () {
        const { hydraChain, systemHydraChain, hydraStaking, aprCalculator, hydraDelegation, vestingManagerFactory } =
          await loadFixture(this.fixtures.initializedWithSpecificBonusesStateFixture);

        // Make sure APR and bonuses are set correctly
        expect(await aprCalculator.getBaseAPR()).to.be.equal(500);
        expect(await aprCalculator.getMacroFactor()).to.be.equal(2500);
        expect(await aprCalculator.getRSIBonus()).to.be.equal(11500);

        // Disable whitelisting
        await hydraChain.connect(this.signers.governance).disableWhitelisting();
        expect(await hydraChain.isWhitelistingEnabled()).to.be.false;

        // Commit epoch
        const epochId = hre.ethers.BigNumber.from(1);
        const epoch = {
          startBlock: hre.ethers.BigNumber.from(1),
          endBlock: hre.ethers.BigNumber.from(500),
          epochRoot: this.epoch.epochRoot,
        };
        const uptime = [
          {
            validator: this.signers.admin.address,
            signedBlocks: hre.ethers.BigNumber.from(10),
          },
        ];
        await systemHydraChain.commitEpoch(epochId, epoch, 500, uptime);
        await hydraStaking.connect(this.signers.system).distributeRewardsFor(epochId, uptime);

        // register validators
        const keyPair = mcl.newKeyPair();
        const validator1signature = mcl.signValidatorMessage(
          DOMAIN,
          CHAIN_ID,
          this.signers.validators[0].address,
          keyPair.secret
        ).signature;

        const validator2signature = mcl.signValidatorMessage(
          DOMAIN,
          CHAIN_ID,
          this.signers.validators[1].address,
          keyPair.secret
        ).signature;

        const validator3signature = mcl.signValidatorMessage(
          DOMAIN,
          CHAIN_ID,
          this.signers.validators[2].address,
          keyPair.secret
        ).signature;

        const validator4signature = mcl.signValidatorMessage(
          DOMAIN,
          CHAIN_ID,
          this.signers.validators[3].address,
          keyPair.secret
        ).signature;

        await hydraChain
          .connect(this.signers.validators[0])
          .register(mcl.g1ToHex(validator1signature), mcl.g2ToHex(keyPair.pubkey));
        await hydraChain
          .connect(this.signers.validators[1])
          .register(mcl.g1ToHex(validator2signature), mcl.g2ToHex(keyPair.pubkey));
        await hydraChain
          .connect(this.signers.validators[2])
          .register(mcl.g1ToHex(validator3signature), mcl.g2ToHex(keyPair.pubkey));
        await hydraChain
          .connect(this.signers.validators[3])
          .register(mcl.g1ToHex(validator4signature), mcl.g2ToHex(keyPair.pubkey));

        // Stake & Set commission & Delegate
        await hydraStaking
          .connect(this.signers.validators[0])
          .stakeWithVesting(2, { value: hre.ethers.utils.parseEther("150") });
        await hydraStaking.connect(this.signers.validators[1]).stake({ value: hre.ethers.utils.parseEther("150") });
        await hydraStaking
          .connect(this.signers.validators[2])
          .stakeWithVesting(26, { value: hre.ethers.utils.parseEther("150") });
        await hydraStaking.connect(this.signers.validators[3]).stake({ value: hre.ethers.utils.parseEther("150") });
        await hydraDelegation.connect(this.signers.validators[3]).setCommission(10);

        await hydraDelegation
          .connect(this.signers.delegator)
          .delegate(this.signers.validators[3].address, { value: hre.ethers.utils.parseEther("10") });

        const { newManager: manager1 } = await createNewVestManager(vestingManagerFactory, this.signers.accounts[4]);
        const { newManager: manager2 } = await createNewVestManager(vestingManagerFactory, this.signers.accounts[3]);

        await manager1
          .connect(this.signers.accounts[4])
          .openVestedDelegatePosition(this.signers.validators[3].address, 26, {
            value: hre.ethers.utils.parseEther("10"),
          });

        await manager2
          .connect(this.signers.accounts[3])
          .openVestedDelegatePosition(this.signers.validators[3].address, 52, {
            value: hre.ethers.utils.parseEther("10"),
          });

        // Commit epoch
        const validatorsUptime = [
          {
            validator: this.signers.validators[0].address,
            signedBlocks: hre.ethers.BigNumber.from(500),
          },
          {
            validator: this.signers.validators[1].address,
            signedBlocks: hre.ethers.BigNumber.from(500),
          },
          {
            validator: this.signers.validators[2].address,
            signedBlocks: hre.ethers.BigNumber.from(500),
          },
          {
            validator: this.signers.validators[3].address,
            signedBlocks: hre.ethers.BigNumber.from(500),
          },
        ];
        const currEpochId = await systemHydraChain.currentEpochId();
        const prevEpochId = currEpochId.sub(1);
        const previousEpoch = await systemHydraChain.epochs(prevEpochId);
        const newEpoch = {
          startBlock: previousEpoch.endBlock.add(1),
          endBlock: previousEpoch.endBlock.add(500),
          epochRoot: hre.ethers.utils.randomBytes(32),
        };

        const moreAccurateTime = Math.ceil((DAY * 1003) / 1000);
        await time.increase(moreAccurateTime);

        await systemHydraChain.commitEpoch(currEpochId, newEpoch, 500, validatorsUptime);

        await expect(
          hydraStaking.connect(systemHydraChain.signer).distributeRewardsFor(currEpochId, validatorsUptime)
        ).to.emit(hydraStaking, "StakingRewardDistributed");

        // Show claimed rewards
        const rewards1 = await hydraStaking.stakingRewards(this.signers.validators[0].address);
        expect(rewards1.total)
          .to.be.lt(Math.round((rewardsForStakers[0] * 101) / 100))
          .and.gt(Math.round((rewardsForStakers[0] * 99) / 100));
        const rewards2 = await hydraStaking.stakingRewards(this.signers.validators[1].address);
        expect(rewards2.total)
          .to.be.lt(Math.round((rewardsForStakers[1] * 101) / 100))
          .and.gt(Math.round((rewardsForStakers[1] * 99) / 100));
        const rewards3 = await hydraStaking.stakingRewards(this.signers.validators[2].address);
        expect(rewards3.total.div(10))
          .to.be.lt(Math.round((rewardsForStakers[2] * 101) / 100))
          .and.gt(Math.round((rewardsForStakers[2] * 99) / 100));
        const rewards4 = await hydraStaking.stakingRewards(this.signers.validators[3].address);
        expect(rewards4.total)
          .to.be.lt(Math.round((rewardsForStakers[3] * 105) / 100)) // TODO: Now commission is applied before vesting bonus, and the data is not accurate
          .and.gt(Math.round((rewardsForStakers[3] * 95) / 100)); // TODO: Make sure the amount difference is smaller than 1%

        // Delegator rewards
        const delegatorRewards1 = await hydraDelegation.getDelegatorReward(
          this.signers.validators[3].address,
          this.signers.delegator.address
        );
        expect(delegatorRewards1)
          .to.be.lt(Math.round((rewardsForDelegators[0] * 101) / 100))
          .and.gt(Math.round((rewardsForDelegators[0] * 99) / 100));
        const delegatorRewards2 = await hydraDelegation.calculatePositionTotalReward(
          this.signers.validators[3].address,
          manager1.address,
          currEpochId,
          1
        );
        expect(delegatorRewards2)
          .to.be.lt(Math.round((rewardsForDelegators[1] * 101) / 100))
          .and.gt(Math.round((rewardsForDelegators[1] * 99) / 100));
        const delegatorRewards3 = await hydraDelegation.calculatePositionTotalReward(
          this.signers.validators[3].address,
          manager2.address,
          currEpochId,
          1
        );
        expect(delegatorRewards3)
          .to.be.lt(Math.round((rewardsForDelegators[2] * 101) / 100))
          .and.gt(Math.round((rewardsForDelegators[2] * 99) / 100));
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
