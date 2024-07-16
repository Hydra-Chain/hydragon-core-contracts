/* eslint-disable node/no-extraneous-import */
import * as hre from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import {
  calculatePenalty,
  calculatePenaltyByWeeks,
  commitEpoch,
  commitEpochs,
  findProperRPSIndex,
  getValidatorReward,
  registerValidator,
} from "../helper";
import { ERRORS, VESTING_DURATION_WEEKS, WEEK } from "../constants";

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
        expect(await hydraStaking.aprCalculatorContract()).to.equal(hre.ethers.constants.AddressZero);

        expect(await hydraStaking.MIN_STAKE_LIMIT()).to.equal(this.minStake);

        // Liquid Delegation
        expect(await hydraStaking.liquidToken()).to.equal(hre.ethers.constants.AddressZero);

        // Withdrawable
        expect(await hydraStaking.withdrawWaitPeriod()).to.equal(0);
      });

      it("should have zero total supply if we pass no validators", async function () {
        const { hydraStaking, hydraDelegation, hydraChain, liquidToken, aprCalculator } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

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
            hydraDelegation.address
          );

        expect(await hydraStaking.totalBalance(), "totalSupply").to.equal(0);
      });

      it("should revert when initialized without system call", async function () {
        const { hydraChain, liquidToken, hydraStaking, hydraDelegation, aprCalculator } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

        await expect(
          hydraStaking.initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            this.minStake,
            liquidToken.address,
            hydraChain.address,
            aprCalculator.address,
            hydraDelegation.address
          )
        )
          .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.systemCallArg);
      });

      it("should revert if minStake is too low", async function () {
        const { hydraStaking, hydraDelegation, hydraChain, liquidToken, aprCalculator } = await loadFixture(
          this.fixtures.presetHydraChainStateFixture
        );

        await expect(
          hydraStaking.connect(this.signers.system).initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            0,
            liquidToken.address,
            hydraChain.address,
            aprCalculator.address,
            hydraDelegation.address
          )
        ).to.be.revertedWithCustomError(hydraStaking, "InvalidMinStake");
      });

      it("should initialize successfully", async function () {
        const { hydraChain, hydraDelegation, liquidToken, hydraStaking, aprCalculator } = await loadFixture(
          this.fixtures.initializedHydraChainStateFixture
        );

        expect(await hydraStaking.owner()).to.equal(this.signers.governance.address);
        expect(await hydraStaking.minStake()).to.equal(this.minStake);
        expect(await hydraStaking.totalStake()).to.equal(this.minStake.mul(2));
        expect(await hydraStaking.totalBalance()).to.equal(this.minStake.mul(2));
        expect(await hydraStaking.hydraChainContract()).to.equal(hydraChain.address);
        expect(await hydraStaking.delegationContract()).to.equal(hydraDelegation.address);
        expect(await hydraStaking.aprCalculatorContract()).to.equal(aprCalculator.address);
        expect(await hydraStaking.stakeOf(this.signers.admin.address)).to.equal(this.minStake.mul(2));
        expect(
          await hydraDelegation.hasRole(await hydraDelegation.DEFAULT_ADMIN_ROLE(), this.signers.governance.address)
        ).to.be.true;

        expect(await hydraStaking.MIN_STAKE_LIMIT()).to.equal(this.minStake);

        // Liquid Delegation
        expect(await hydraStaking.liquidToken()).to.equal(liquidToken.address);

        // Withdrawable
        expect(await hydraStaking.withdrawWaitPeriod()).to.equal(WEEK);
      });

      it("should revert on re-initialization attempt", async function () {
        const { hydraChain, hydraDelegation, liquidToken, hydraStaking, aprCalculator, vestingManagerFactory } =
          await loadFixture(this.fixtures.initializedHydraChainStateFixture);

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
            vestingManagerFactory.address
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

    describe("DelegatedStaking", function () {
      it("should revert if we try to call OnDelegate from non-HydraDelegate contract", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraStaking.onDelegate(this.signers.accounts[1].address))
          .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.onlyHydraDelegationArg);
      });

      it("should revert if we try to call OnDelegate with non-active Validator from Delegate contract", async function () {
        const { hydraDelegation, hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraDelegation.delegate(this.signers.accounts[5].address, { value: this.minDelegation }))
          .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.inactiveStakerArg);
      });

      it("should revert if we try to call OnUnDelegate from non-HydraDelegate contract", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(hydraStaking.onUndelegate(this.signers.accounts[3].address))
          .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.onlyHydraDelegationArg);
      });

      it("should emit BalanceChanged event when delegating", async function () {
        const { hydraDelegation, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        const validatorBalanceBefore = await hydraStaking.totalBalanceOf(this.signers.validators[0].address);
        const tx = await hydraDelegation.delegate(this.signers.validators[0].address, { value: this.minDelegation });

        await expect(tx)
          .to.emit(hydraStaking, "BalanceChanged")
          .withArgs(this.signers.validators[0].address, this.minDelegation.add(validatorBalanceBefore));
      });

      it("should emit BalanceChanged event on undelegate", async function () {
        const { hydraDelegation, hydraStaking } = await loadFixture(this.fixtures.delegatedFixture);

        const validatorBalanceBefore = await hydraStaking.totalBalanceOf(this.signers.validators[0].address);
        const tx = await hydraDelegation
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, this.minDelegation);

        await expect(tx)
          .to.emit(hydraStaking, "BalanceChanged")
          .withArgs(this.signers.validators[0].address, validatorBalanceBefore.sub(this.minDelegation));
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

    describe("Stake", function () {
      it("should allow only registered validators to stake", async function () {
        // * Only the first three validators are being registered
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

        await expect(hydraStaking.connect(this.signers.validators[3]).stake({ value: this.minStake }))
          .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
          .withArgs(ERRORS.mustBeRegistered);
      });

      it("should revert if min amount not reached", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

        await expect(hydraStaking.connect(this.signers.validators[0]).stake({ value: this.minStake.div(2) }))
          .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
          .withArgs("stake", "STAKE_TOO_LOW");
      });

      it("should be able to stake", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);
        const validator = this.signers.validators[0];
        const tx = await hydraStaking.connect(validator).stake({ value: this.minStake });

        await expect(tx, "Staked emitted").to.emit(hydraStaking, "Staked").withArgs(validator.address, this.minStake);
        expect(await hydraStaking.stakeOf(validator.address), "staked amount").to.equal(this.minStake);
        expect(await hydraStaking.totalBalanceOf(validator.address), "total balance (stake + delegated)").to.equal(
          this.minStake
        );
      });

      it("should allow fully-unstaked validator to stake again", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);
        const validator = this.signers.validators[0];
        const validatorHydraStaking = hydraStaking.connect(validator);

        await validatorHydraStaking.stake({ value: this.minStake });
        expect(await hydraStaking.stakeOf(validator.address)).to.equal(this.minStake);

        await validatorHydraStaking.unstake(this.minStake);
        expect(await hydraStaking.stakeOf(validator.address)).to.equal(0);

        await expect(validatorHydraStaking.stake({ value: this.minStake })).to.not.be.reverted;
      });
    });

    describe("Unstake", function () {
      it("should not be able to unstake if there is insufficient staked balance", async function () {
        const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
        const validator = this.signers.validators[0];
        const unstakeInsufficientAmount = this.minStake.mul(2).add(1);

        // Send more liquid tokens to the validator so he has enough to make the unstake
        await liquidToken.connect(this.signers.validators[1]).transfer(validator.address, 1);

        await expect(hydraStaking.connect(validator).unstake(unstakeInsufficientAmount))
          .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
          .withArgs("unstake", "INSUFFICIENT_BALANCE");
      });

      it("should not be able to exploit int overflow", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        await expect(hydraStaking.connect(this.signers.validators[0]).unstake(hre.ethers.constants.MaxInt256.add(1))).to
          .be.reverted;
      });

      it("should not be able to unstake so that less than minStake is left", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
        const amountToUnstake = this.minStake.add(hre.ethers.utils.parseEther("0.2"));

        await expect(hydraStaking.unstake(amountToUnstake))
          .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
          .withArgs("unstake", "STAKE_TOO_LOW");
      });

      it("should revert with insufficient balance when trying to unstake from the delegation pool", async function () {
        const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.delegatedFixture);
        const validator = this.signers.validators[0];
        const totalValidatorBalance = await hydraStaking.totalBalanceOf(validator.address);
        const unstakeAmount = totalValidatorBalance.sub(this.minStake);

        // Send more liquid tokens to the validator so he has enough to make the unstake
        await liquidToken.connect(this.signers.validators[1]).transfer(validator.address, this.minStake.mul(2));

        await expect(hydraStaking.connect(validator).unstake(unstakeAmount))
          .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
          .withArgs("unstake", "INSUFFICIENT_BALANCE");
      });

      it("should be able to partially unstake", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
        const validator = this.signers.validators[0];

        const amountToUnstake = hre.ethers.utils.parseEther("0.2");
        const tx = await hydraStaking.connect(validator).unstake(amountToUnstake);
        await expect(tx).to.emit(hydraStaking, "Unstaked").withArgs(validator.address, amountToUnstake);
      });

      it("should take pending unstakes into account", async function () {
        const { hydraStaking, liquidToken } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
        const validator = this.signers.validators[0];
        const validatorHydraStaking = hydraStaking.connect(validator);

        const amountToUnstake = this.minStake.div(2);
        const amountLeft = this.minStake.mul(2).sub(amountToUnstake);

        await validatorHydraStaking.unstake(amountToUnstake);

        // Send more liquid tokens to the validator so he has enough to make the unstake
        await liquidToken.connect(this.signers.validators[1]).transfer(validator.address, this.minStake.mul(2));

        await expect(validatorHydraStaking.unstake(amountLeft.add(1)))
          .to.be.revertedWithCustomError(hydraStaking, "StakeRequirement")
          .withArgs("unstake", "INSUFFICIENT_BALANCE");
      });

      it("should be able to completely unstake", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
        const validator = this.signers.validators[0];

        const tx = hydraStaking.connect(validator).unstake(this.minStake.mul(2));
        await expect(tx).to.emit(hydraStaking, "Unstaked").withArgs(validator.address, this.minStake.mul(2));
      });

      it("should place in withdrawal queue", async function () {
        const { hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);
        const validator = this.signers.validators[0];

        await hydraStaking.connect(validator).unstake(this.minStake.mul(2));

        expect(await hydraStaking.pendingWithdrawals(validator.address)).to.equal(this.minStake.mul(2));
        expect(await hydraStaking.withdrawable(validator.address)).to.equal(0);
      });
    });

    describe("Claim Rewards", function () {
      it("should claim validator reward", async function () {
        const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1]],
          this.epochSize
        );

        const reward = await hydraStaking.unclaimedRewards(this.signers.validators[0].address);
        const tx = await hydraStaking.connect(this.signers.validators[0])["claimStakingRewards()"]();
        const receipt = await tx.wait();

        const event = receipt.events?.find((log: any) => log.event === "StakingRewardsClaimed");
        expect(event?.args?.account, "event.arg.account").to.equal(this.signers.validators[0].address);
        expect(event?.args?.amount, "event.arg.amount").to.equal(reward);

        await expect(tx, "StakingRewardsClaimed")
          .to.emit(hydraStaking, "StakingRewardsClaimed")
          .withArgs(this.signers.validators[0].address, reward);
      });
    });

    describe("Staking Vesting", function () {
      const vestingDuration = VESTING_DURATION_WEEKS * WEEK;

      before(async function () {
        this.staker = this.signers.accounts[9];
      });

      describe("openVestedPosition()", function () {
        it("should open vested position", async function () {
          const { hydraChain, systemHydraChain, hydraStaking, aprCalculator } = await loadFixture(
            this.fixtures.stakedValidatorsStateFixture
          );

          await hydraChain.connect(this.signers.governance).addToWhitelist([this.staker.address]);
          await registerValidator(hydraChain, this.staker);
          const stakerHydraStaking = hydraStaking.connect(this.staker);
          const tx = await stakerHydraStaking.stakeWithVesting(VESTING_DURATION_WEEKS, {
            value: this.minStake,
          });

          const vestingData = await hydraStaking.vestedStakingPositions(this.staker.address);
          if (!tx) {
            throw new Error("block number is undefined");
          }

          expect(vestingData.duration, "duration").to.be.equal(vestingDuration);
          const start = await time.latest();
          expect(vestingData.start, "start").to.be.equal(start);
          expect(vestingData.end, "end").to.be.equal(start + vestingDuration);
          expect(vestingData.base, "base").to.be.equal(await aprCalculator.base());
          expect(vestingData.vestBonus, "vestBonus").to.be.equal(await aprCalculator.getVestingBonus(10));
          expect(vestingData.rsiBonus, "rsiBonus").to.be.equal(await aprCalculator.rsi());

          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            1, // number of epochs to commit
            this.epochSize
          );

          // check is stake = min stake
          expect(await hydraStaking.stakeOf(this.staker.address), "stake").to.be.equal(this.minStake);
        });

        it("should not be in vesting cycle", async function () {
          const { stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

          await expect(stakerHydraStaking.stakeWithVesting(vestingDuration))
            .to.be.revertedWithCustomError(stakerHydraStaking, "StakeRequirement")
            .withArgs("stakeWithVesting", "ALREADY_IN_VESTING_CYCLE");
        });
      });

      describe("decrease staking position with unstake()", function () {
        it("should revert when penalizeStaker function is not called by HydraChain", async function () {
          const { hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

          await expect(
            hydraStaking.connect(this.signers.accounts[1]).penalizeStaker(this.signers.accounts[1].address, [])
          )
            .to.be.revertedWithCustomError(hydraStaking, "Unauthorized")
            .withArgs("ONLY_HYDRA_CHAIN");
        });

        it("should get staker penalty and rewards must return 0 (burned), if closing from active position", async function () {
          const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
            this.fixtures.newVestingValidatorFixture
          );

          // commit some more epochs to generate additional rewards
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            5,
            this.epochSize
          );

          // get validator's reward amount
          const validatorReward = await getValidatorReward(stakerHydraStaking, this.staker.address);

          // reward must be bigger than 0
          expect(validatorReward, "validatorReward").to.be.gt(0);

          const position = await hydraStaking.vestedStakingPositions(this.staker.address);
          const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());
          // get the penalty and reward from the contract
          const { penalty, reward } = await hydraStaking.calcVestedStakingPositionPenalty(
            this.staker.address,
            this.minStake
          );

          // calculate penalty locally
          const calculatedPenalty = await calculatePenalty(position, latestTimestamp, this.minStake);

          expect(penalty, "penalty").to.be.gt(0);
          expect(penalty, "penalty = calculatedPenalty").to.be.equal(calculatedPenalty);
          expect(reward, "reward").to.be.equal(0); // if active position, reward is burned
        });

        it("should decrease staking position and apply slashing penalty", async function () {
          const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
            this.fixtures.newVestingValidatorFixture
          );

          await stakerHydraStaking.stake({ value: this.minStake });

          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            1, // number of epochs to commit
            this.epochSize
          );

          const unstakeAmount = this.minStake.div(2);
          const position = await hydraStaking.vestedStakingPositions(this.staker.address);
          const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());
          const nextTimestamp = latestTimestamp.add(2);
          await time.setNextBlockTimestamp(nextTimestamp);

          const penalty = await calculatePenalty(position, nextTimestamp, unstakeAmount);
          await expect(stakerHydraStaking.unstake(unstakeAmount), "unstake").to.changeEtherBalance(
            hydraStaking,
            penalty.mul(-1)
          );

          const withdrawalAmount = await stakerHydraStaking.pendingWithdrawals(this.staker.address);
          expect(withdrawalAmount, "withdrawal amount = calculated amount").to.equal(unstakeAmount.sub(penalty));

          // increase time to be able to withdraw
          await time.increase(WEEK);

          await expect(stakerHydraStaking.withdraw(this.staker.address), "withdraw").to.changeEtherBalance(
            hydraStaking,
            unstakeAmount.sub(penalty).mul(-1)
          );
        });

        it("should slash when unstakes exactly 1 week after the start of the vesting position", async function () {
          const { hydraStaking, stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

          const position = await hydraStaking.vestedStakingPositions(this.staker.address);
          const nextTimestamp = position.start.add(WEEK);
          await time.setNextBlockTimestamp(nextTimestamp);
          await stakerHydraStaking.unstake(this.minStake);

          // hardcode the penalty percent by 1% a week (9 weeks should be left)
          const penalty = await calculatePenaltyByWeeks(VESTING_DURATION_WEEKS - 1, this.minStake);

          const withdrawalAmount = await stakerHydraStaking.pendingWithdrawals(this.staker.address);
          expect(withdrawalAmount, "withdrawal amount = calculated amount").to.equal(this.minStake.sub(penalty));

          // increase time to be able to withdraw
          await time.increase(WEEK);
          await expect(stakerHydraStaking.withdraw(this.staker.address), "withdraw").to.changeEtherBalance(
            hydraStaking,
            this.minStake.sub(penalty).mul(-1)
          );
        });

        it("should delete position data when full amount removed", async function () {
          const { hydraStaking, stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

          await stakerHydraStaking.unstake(await hydraStaking.stakeOf(this.staker.address));

          const position = await hydraStaking.vestedStakingPositions(this.staker.address);

          expect(position.start, "start").to.be.equal(0);
          expect(position.end, "end").to.be.equal(0);
          expect(position.duration, "duration").to.be.equal(0);
        });

        it("should withdraw and validate there are no pending withdrawals", async function () {
          const { stakerHydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);

          await stakerHydraStaking.unstake(await stakerHydraStaking.stakeOf(this.staker.address));

          // increase time to be able to withdraw
          await time.increase(WEEK);
          await stakerHydraStaking.withdraw(this.staker.address);

          expect(await stakerHydraStaking.pendingWithdrawals(this.staker.address)).to.equal(0);
        });
      });

      describe("Claim position reward", function () {
        it("should not be able to claim when active", async function () {
          const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
            this.fixtures.newVestingValidatorFixture
          );

          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            1, // number of epochs to commit
            this.epochSize
          );

          await stakerHydraStaking.stake({ value: this.minStake });

          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            1, // number of epochs to commit
            this.epochSize
          );

          const reward = await getValidatorReward(hydraStaking, this.staker.address);
          expect(reward).to.be.gt(0);
        });

        it("should revert claimValidatorReward(epoch) when giving wrong index", async function () {
          const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.vestingRewardsFixture);

          // add reward exactly before maturing (second to the last block)
          const position = await hydraStaking.vestedStakingPositions(this.staker.address);
          const penultimate = position.end.sub(1);
          await time.setNextBlockTimestamp(penultimate.toNumber());
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            1, // number of epochs to commit
            this.epochSize
          );

          // enter maturing state
          const nextTimestampMaturing = position.end.add(position.duration.div(2));
          await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

          // calculate up to which epoch rewards are matured
          const valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
          const valRewardHistoryRecordIndex = findProperRPSIndex(
            valRewardsHistoryRecords,
            position.end.sub(position.duration.div(2))
          );

          // revert claim reward when adding 1 to the index
          await expect(
            hydraStaking.connect(this.staker)["claimStakingRewards(uint256)"](valRewardHistoryRecordIndex + 1)
          ).to.be.reverted;
        });

        it("should be able to claim with claimValidatorReward(epoch) when maturing", async function () {
          const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.vestingRewardsFixture);

          // add reward exactly before maturing (second to the last block)
          const position = await hydraStaking.vestedStakingPositions(this.staker.address);
          const penultimate = position.end.sub(1);
          await time.setNextBlockTimestamp(penultimate.toNumber());
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            1, // number of epochs to commit
            this.epochSize
          );

          // enter maturing state
          const nextTimestampMaturing = position.end.add(position.duration.div(2));
          await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

          // calculate up to which epoch rewards are matured
          const valRewardsHistoryRecords = await hydraStaking.getStakingRewardsHistoryValues(this.staker.address);
          const valRewardHistoryRecordIndex = findProperRPSIndex(
            valRewardsHistoryRecords,
            position.end.sub(position.duration.div(2))
          );

          // claim reward
          await expect(
            hydraStaking.connect(this.staker)["claimStakingRewards(uint256)"](valRewardHistoryRecordIndex)
          ).to.emit(hydraStaking, "StakingRewardsClaimed");
        });

        it("should be able to claim whole reward when not in position", async function () {
          const { stakerHydraStaking, systemHydraChain, hydraStaking } = await loadFixture(
            this.fixtures.vestingRewardsFixture
          );

          // add reward exactly before maturing (second to the last block)
          const position = await hydraStaking.vestedStakingPositions(this.staker.address);
          const penultimate = position.end.sub(1);
          await time.setNextBlockTimestamp(penultimate.toNumber());
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], this.staker],
            1, // number of epochs to commit
            this.epochSize
          );

          // enter matured state
          const nextTimestampMaturing = position.end.add(position.duration);
          await time.setNextBlockTimestamp(nextTimestampMaturing.toNumber());

          // get reward amount
          const reward = await getValidatorReward(hydraStaking, this.staker.address);

          // reward must be bigger than 0
          expect(reward).to.be.gt(0);

          // claim reward
          await expect(stakerHydraStaking["claimStakingRewards()"]())
            .to.emit(hydraStaking, "StakingRewardsClaimed")
            .withArgs(this.staker.address, reward);
        });
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
  });
}
