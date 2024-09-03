/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

// eslint-disable-next-line camelcase
import { ERRORS, WEEK, EPOCHS_YEAR, MAX_COMMISSION, INITIAL_COMMISSION, DEADLINE } from "../constants";
import {
  commitEpochs,
  retrieveRPSData,
  commitEpoch,
  calculateExpectedReward,
  getPermitSignature,
  calcLiquidTokensToDistributeOnVesting,
} from "../helper";
import { RunSwapVestedPositionStakerTests } from "./SwapVestedPositionStaker.test";
import { RunDelegationTests } from "./Delegation.test";
import { RunVestedDelegationTests } from "./VestedDelegation.test";
// eslint-disable-next-line camelcase
import { LiquidityToken__factory } from "../../typechain-types";

export function RunHydraDelegationTests(): void {
  describe("", function () {
    describe("HydraDelegation initializations", function () {
      it("should validate default values when HydraDelegation deployed", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        expect(hydraDelegation.deployTransaction.from).to.equal(this.signers.admin.address);
        expect(await hydraDelegation.owner()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraDelegation.minDelegation()).to.equal(0);
        expect(await hydraDelegation.totalDelegation()).to.equal(0);
        expect(await hydraDelegation.hydraChainContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraDelegation.hydraStakingContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraDelegation.aprCalculatorContract()).to.equal(hre.ethers.constants.AddressZero);

        expect(await hydraDelegation.MAX_COMMISSION()).to.equal(MAX_COMMISSION);
        expect(await hydraDelegation.MIN_DELEGATION_LIMIT()).to.equal(this.minDelegation);

        // Vested Delegation
        expect(await hydraDelegation.vestingManagerFactoryContract()).to.equal(hre.ethers.constants.AddressZero);

        // Liquid Delegation
        expect(await hydraDelegation.liquidToken()).to.equal(hre.ethers.constants.AddressZero);

        // Withdrawable
        expect(await hydraDelegation.withdrawWaitPeriod()).to.equal(0);
      });

      it("should revert when initialized without system call", async function () {
        const {
          hydraChain,
          hydraDelegation,
          liquidToken,
          hydraStaking,
          aprCalculator,
          vestingManagerFactory,
          rewardWallet,
        } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

        await expect(
          hydraDelegation.initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            INITIAL_COMMISSION,
            liquidToken.address,
            aprCalculator.address,
            hydraStaking.address,
            hydraChain.address,
            vestingManagerFactory.address,
            rewardWallet.address
          )
        )
          .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.systemCallArg);
      });

      it("should revert when initialize with invalid commission", async function () {
        const {
          hydraChain,
          hydraDelegation,
          liquidToken,
          hydraStaking,
          aprCalculator,
          vestingManagerFactory,
          rewardWallet,
        } = await loadFixture(this.fixtures.presetHydraChainStateFixture);
        const exceededCommission = MAX_COMMISSION.add(1);

        await expect(
          hydraDelegation.connect(this.signers.system).initialize(
            // eslint-disable-next-line node/no-unsupported-features/es-syntax
            [{ ...this.validatorInit, addr: this.signers.accounts[1].address }],
            this.signers.governance.address,
            exceededCommission,
            liquidToken.address,
            aprCalculator.address,
            hydraStaking.address,
            hydraChain.address,
            vestingManagerFactory.address,
            rewardWallet.address
          )
        )
          .to.be.revertedWithCustomError(hydraDelegation, "InvalidCommission")
          .withArgs(exceededCommission);
      });

      it("should initialize successfully", async function () {
        const {
          hydraChain,
          hydraDelegation,
          liquidToken,
          hydraStaking,
          aprCalculator,
          vestingManagerFactory,
          rewardWallet,
        } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        expect(
          await hydraDelegation.delegationCommissionPerStaker(this.signers.admin.address),
          "delegationCommissionPerStaker"
        ).to.equal(INITIAL_COMMISSION);

        expect(
          (await hydraDelegation.delegationPools(this.signers.admin.address)).staker,
          "delegationPool.staker"
        ).to.equal(this.signers.admin.address);

        expect(await hydraDelegation.owner(), "owner").to.equal(this.signers.governance.address);
        expect(await hydraDelegation.minDelegation(), "minDelegation").to.equal(this.minDelegation);
        expect(await hydraDelegation.hydraChainContract(), "hydraChainContract").to.equal(hydraChain.address);
        expect(await hydraDelegation.hydraStakingContract(), "hydraStakingContract").to.equal(hydraStaking.address);
        expect(await hydraDelegation.aprCalculatorContract(), "aprCalculatorContract").to.equal(aprCalculator.address);
        expect(
          await hydraDelegation.hasRole(await hydraDelegation.DEFAULT_ADMIN_ROLE(), this.signers.governance.address),
          "hasRole"
        ).to.be.true;

        // Vested Delegation
        expect(await hydraDelegation.vestingManagerFactoryContract(), "vestingManagerFactoryContract").to.equal(
          vestingManagerFactory.address
        );

        // Liquid Delegation
        expect(await hydraDelegation.liquidToken(), "liquidToken").to.equal(liquidToken.address);

        // Withdrawable
        expect(await hydraDelegation.withdrawWaitPeriod(), "withdrawWaitPeriod").to.equal(WEEK);

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

    describe("Set Commission", function () {
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

    describe("Change minDelegate", function () {
      it("should revert if non-default_admin_role address try to change MinDelegation", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        // eslint-disable-next-line no-unused-vars
        const adminRole = await hydraDelegation.DEFAULT_ADMIN_ROLE();

        await expect(
          hydraDelegation.connect(this.signers.validators[0]).changeMinDelegation(this.minDelegation.mul(2))
        ).to.be.revertedWith(ERRORS.accessControl(this.signers.validators[0].address.toLocaleLowerCase(), adminRole));

        expect(await hydraDelegation.minDelegation()).to.be.equal(this.minDelegation);
      });

      it("should revert if MinDelegation is too low", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        // eslint-disable-next-line no-unused-vars
        const newLowMinDelegation = this.minStake.div(2);

        await expect(
          hydraDelegation.connect(this.signers.governance).changeMinDelegation(newLowMinDelegation)
        ).to.be.revertedWithCustomError(hydraDelegation, "InvalidMinDelegation");

        expect(await hydraDelegation.minDelegation()).to.be.equal(this.minDelegation);
      });

      it("should change MinDelegation by default_admin_role address", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        const newMinDelegation = this.minDelegation.mul(2);

        await expect(hydraDelegation.connect(this.signers.governance).changeMinDelegation(newMinDelegation)).to.not.be
          .reverted;

        expect(await hydraDelegation.minDelegation()).to.be.equal(newMinDelegation);
      });
    });

    describe("Claim rewards", function () {
      it("should claim delegator reward", async function () {
        it("should revert distributeDelegationRewards when not called by HydraStaking Contract", async function () {
          const { hydraDelegation } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

          await expect(
            hydraDelegation
              .connect(this.signers.accounts[1])
              .distributeDelegationRewards(this.signers.accounts[1].address, 1, 1)
          )
            .to.be.revertedWithCustomError(hydraDelegation, ERRORS.unauthorized.name)
            .withArgs(ERRORS.unauthorized.onlyHydraStakingArg);
        });

        const { systemHydraChain, hydraStaking, hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], this.signers.validators[2]],
          2, // number of epochs to commit
          this.epochSize
        );

        const reward = await hydraDelegation.getDelegatorReward(
          this.signers.validators[0].address,
          this.signers.delegator.address
        );

        const tx = await hydraDelegation
          .connect(this.signers.delegator)
          .claimDelegatorReward(this.signers.validators[0].address);
        const receipt = await tx.wait();
        const event = receipt.events?.find((log: any) => log.event === "DelegatorRewardsClaimed");
        expect(event?.args?.staker, "event.arg.staker").to.equal(this.signers.validators[0].address);
        expect(event?.args?.delegator, "event.arg.delegator").to.equal(this.signers.delegator.address);
        expect(event?.args?.amount, "event.arg.amount").to.equal(reward);
      });

      it("should revert when not the vest manager owner", async function () {
        const { vestManager, delegatedValidator } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

        await expect(
          vestManager.connect(this.signers.accounts[10]).claimVestedPositionReward(delegatedValidator.address, 0, 0)
        ).to.be.revertedWith(ERRORS.ownable);
      });

      it("should not claim when active position", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation, vestManager, delegatedValidator } = await loadFixture(
          this.fixtures.weeklyVestedDelegationFixture
        );

        // ensure is active position
        expect(
          await hydraDelegation.isActiveDelegatePosition(delegatedValidator.address, vestManager.address),
          "isActive"
        ).to.be.true;
        const balanceBefore = await delegatedValidator.getBalance();

        // reward to be accumulated
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize
        );

        expect(
          await hydraDelegation.getRawDelegatorReward(delegatedValidator.address, vestManager.address),
          "getRawDelegatorReward"
        ).to.be.gt(0);

        // claim & check balance
        await vestManager.claimVestedPositionReward(delegatedValidator.address, 0, 0);
        const balanceAfter = await delegatedValidator.getBalance();
        expect(balanceAfter).to.be.eq(balanceBefore);
      });

      it("should return when unused position", async function () {
        const { hydraDelegation, liquidToken, vestManager, vestManagerOwner, delegatedValidator } = await loadFixture(
          this.fixtures.weeklyVestedDelegationFixture
        );

        const delegatedAmount = await hydraDelegation.delegationOf(delegatedValidator.address, vestManager.address);
        // ensure is active position
        expect(
          await hydraDelegation.isActiveDelegatePosition(delegatedValidator.address, vestManager.address),
          "isActive"
        ).to.be.true;

        await liquidToken
          .connect(vestManagerOwner)
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, delegatedAmount)
          );
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedAmount);

        // check reward
        expect(
          await hydraDelegation.getRawDelegatorReward(delegatedValidator.address, vestManager.address),
          "getRawDelegatorReward"
        ).to.be.eq(0);
        expect(await hydraDelegation.withdrawable(vestManager.address), "withdrawable").to.eq(0);
      });

      it("should revert when wrong rps index is provided", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation, vestManager, delegatedValidator } = await loadFixture(
          this.fixtures.weeklyVestedDelegationFixture
        );

        // finish the vesting period
        await time.increase(WEEK * 52);

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await retrieveRPSData(
          systemHydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        await expect(
          vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, balanceChangeIndex),
          "claimVestedPositionReward"
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "INVALID_EPOCH");

        // commit epoch
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize
        );

        await expect(
          vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum + 1, balanceChangeIndex),
          "claimVestedPositionReward2"
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "WRONG_RPS");
      });

      it("should properly claim reward when not fully matured", async function () {
        const {
          systemHydraChain,
          hydraStaking,
          hydraDelegation,
          vestManager,
          vestManagerOwner,
          delegatedValidator,
          aprCalculator,
          rewardWallet,
        } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

        // calculate base rewards
        const baseReward = await hydraDelegation.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        const base = await aprCalculator.base();
        const vestBonus = await aprCalculator.getVestingBonus(1);
        const rsi = await aprCalculator.rsi();
        const expectedReward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

        // commit epoch, so more reward is added that must not be claimed now
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize,
          WEEK + 1
        );

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await retrieveRPSData(
          systemHydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        await expect(
          await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, balanceChangeIndex),
          "claimVestedPositionReward"
        ).to.changeEtherBalances(
          [vestManagerOwner.address, rewardWallet.address],
          [expectedReward, expectedReward.mul(-1)]
        );
      });

      it("should properly claim reward when position fully matured", async function () {
        const {
          systemHydraChain,
          hydraStaking,
          hydraDelegation,
          vestManager,
          vestManagerOwner,
          delegatedValidator,
          aprCalculator,
          rewardWallet,
        } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

        // calculate base rewards
        const baseReward = await hydraDelegation.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        const base = await aprCalculator.base();
        const vestBonus = await aprCalculator.getVestingBonus(1);
        const rsi = await aprCalculator.rsi();
        const expectedReward = await calculateExpectedReward(base, vestBonus, rsi, baseReward);

        // more rewards to be distributed
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize,
          WEEK * 2 + 1
        );

        const additionalReward = (
          await hydraDelegation.getRawDelegatorReward(delegatedValidator.address, vestManager.address)
        ).sub(baseReward);

        const expectedAdditionalReward = base.mul(additionalReward).div(10000).div(EPOCHS_YEAR);
        const expectedFinalReward = expectedReward.add(expectedAdditionalReward);

        // prepare params for call
        const { position, epochNum, balanceChangeIndex } = await retrieveRPSData(
          systemHydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        // ensure rewards are matured
        const areRewardsMatured = position.end.add(position.duration).lt(await time.latest());
        expect(areRewardsMatured, "areRewardsMatured").to.be.true;

        await expect(
          await vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, balanceChangeIndex),
          "claimVestedPositionReward"
        ).to.changeEtherBalances(
          [vestManagerOwner.address, rewardWallet.address],
          [expectedFinalReward, expectedFinalReward.mul(-1)]
        );
      });
    });

    describe("StakeSyncer", function () {
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

        it("should distribute decreased amount of liquid tokens", async function () {
          const { vestManager, hydraDelegation } = await loadFixture(this.fixtures.vestManagerFixture);

          const validator = this.signers.validators[0];
          const vestingDuration = 12; // weeks

          await expect(
            vestManager.openVestedDelegatePosition(validator.address, vestingDuration, { value: this.minDelegation })
          ).to.changeTokenBalance(
            LiquidityToken__factory.connect(await hydraDelegation.liquidToken(), hre.ethers.provider),
            await vestManager.owner(),
            calcLiquidTokensToDistributeOnVesting(vestingDuration, this.minDelegation)
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
            .swapVestedPositionStaker(validator.address, newValidator.address);
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

          await liquidToken
            .connect(vestManagerOwner)
            .approve(
              vestManager.address,
              await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, this.minDelegation)
            );
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
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, this.minDelegation),
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

    describe("Delegation", function () {
      RunDelegationTests();
    });

    describe("VestedDelegation", function () {
      RunVestedDelegationTests();
    });

    describe("SwapVestedPosition", function () {
      RunSwapVestedPositionStakerTests();
    });
  });
}
