/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

// eslint-disable-next-line camelcase
import {
  ERRORS,
  WEEK,
  MAX_COMMISSION,
  INITIAL_COMMISSION,
  DEADLINE,
  TABLE_DATA_REWARDS_FOR_STAKER,
  TABLE_DATA_REWARDS_FOR_DELEGATORS,
  DAY,
  DENOMINATOR,
} from "../constants";
import {
  commitEpochs,
  getClaimableRewardRPSData,
  commitEpoch,
  applyVestingAPR,
  getPermitSignature,
  calcLiquidTokensToDistributeOnVesting,
  createNewVestManager,
  calculateCommissionCutFromFinalReward,
  calculateCommissionCutFromDelegatorReward,
  applyCommissionToReward,
  calcExpectedPositionRewardForActivePosition,
  registerValidator,
  setAndApplyCommission,
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
        expect(await hydraDelegation.minDelegation()).to.equal(0);
        expect(await hydraDelegation.totalDelegation()).to.equal(0);
        expect(await hydraDelegation.hydraChainContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraDelegation.hydraStakingContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(await hydraDelegation.aprCalculatorContract()).to.equal(hre.ethers.constants.AddressZero);
        expect(
          await hydraDelegation.hasRole(await hydraDelegation.DEFAULT_ADMIN_ROLE(), this.signers.governance.address),
          "hasRole"
        ).to.be.false;

        expect(await hydraDelegation.MAX_COMMISSION()).to.equal(MAX_COMMISSION);
        expect(await hydraDelegation.MIN_DELEGATION_LIMIT()).to.equal(this.minDelegation);

        // Vested Delegation
        expect(await hydraDelegation.penaltyDecreasePerWeek()).to.equal(0);
        expect(await hydraDelegation.vestingLiquidityDecreasePerWeek()).to.equal(0);
        expect(await hydraDelegation.vestingManagerFactoryContract()).to.equal(hre.ethers.constants.AddressZero);

        expect(await hydraDelegation.DENOMINATOR()).to.equal(DENOMINATOR);

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
        ).to.be.revertedWithCustomError(hydraDelegation, "InvalidCommission");
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

        expect(await hydraDelegation.minDelegation(), "minDelegation").to.equal(this.minDelegation);
        expect(await hydraDelegation.hydraChainContract(), "hydraChainContract").to.equal(hydraChain.address);
        expect(await hydraDelegation.hydraStakingContract(), "hydraStakingContract").to.equal(hydraStaking.address);
        expect(await hydraDelegation.aprCalculatorContract(), "aprCalculatorContract").to.equal(aprCalculator.address);
        expect(
          await hydraDelegation.hasRole(await hydraDelegation.DEFAULT_ADMIN_ROLE(), this.signers.governance.address),
          "hasRole"
        ).to.be.true;

        // Vested Delegation
        expect(await hydraDelegation.penaltyDecreasePerWeek()).to.equal(50);
        expect(await hydraDelegation.vestingLiquidityDecreasePerWeek()).to.equal(133);
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
      it("should revert setting initial commission if not called by HydraChain", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        await expect(
          hydraDelegation
            .connect(this.signers.validators[3])
            .setInitialCommission(this.signers.validators[3].address, 10)
        )
          .to.be.revertedWithCustomError(hydraDelegation, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.onlyHydraChainArg);
      });

      it("should set initial commission on register", async function () {
        const { hydraDelegation, hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

        // set commission and verify event
        await registerValidator(hydraChain, this.signers.validators[0], 10);

        // get the update validator and ensure that the new commission is set
        expect(await hydraDelegation.delegationCommissionPerStaker(this.signers.validators[0].address)).to.equal(10);
      });

      it("should revert with invalid commission on pending", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        const exceededCommission = MAX_COMMISSION.add(1);

        await expect(
          hydraDelegation.connect(this.signers.validators[0]).setPendingCommission(exceededCommission)
        ).to.be.revertedWithCustomError(hydraDelegation, "InvalidCommission");
      });

      it("should set pending commission", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        // set commission and verify event
        const newCommission = MAX_COMMISSION.div(2);
        await expect(hydraDelegation.connect(this.signers.validators[0]).setPendingCommission(newCommission))
          .to.emit(hydraDelegation, "PendingCommissionAdded")
          .withArgs(this.signers.validators[0].address, newCommission);

        // get the update validator and ensure that the new commission is set
        expect(await hydraDelegation.pendingCommissionPerStaker(this.signers.validators[0].address)).to.equal(
          newCommission
        );
        expect(await hydraDelegation.commissionUpdateAvailableAt(this.signers.validators[0].address)).to.be.above(0);
      });

      it("should set pending commission again and reset the timer", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        // set commission and verify event
        const newCommission = MAX_COMMISSION.div(2);
        await expect(hydraDelegation.connect(this.signers.validators[0]).setPendingCommission(newCommission))
          .to.emit(hydraDelegation, "PendingCommissionAdded")
          .withArgs(this.signers.validators[0].address, newCommission);

        // get the update validator and ensure that the new commission is set
        expect(await hydraDelegation.pendingCommissionPerStaker(this.signers.validators[0].address)).to.equal(
          newCommission
        );
        const oldUpdateTime = await hydraDelegation.commissionUpdateAvailableAt(this.signers.validators[0].address);
        expect(oldUpdateTime).to.be.above(0);

        const newCommission2 = MAX_COMMISSION.div(4);
        // set commission again and verify event
        await expect(hydraDelegation.connect(this.signers.validators[0]).setPendingCommission(newCommission2))
          .to.emit(hydraDelegation, "PendingCommissionAdded")
          .withArgs(this.signers.validators[0].address, newCommission2);

        expect(await hydraDelegation.pendingCommissionPerStaker(this.signers.validators[0].address)).to.equal(
          newCommission2
        );
        expect(await hydraDelegation.commissionUpdateAvailableAt(this.signers.validators[0].address)).to.be.above(
          oldUpdateTime
        );
      });

      it("should revert applying pending commission earlier than 15 days", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        const newCommission = MAX_COMMISSION.div(2);
        await hydraDelegation.connect(this.signers.validators[0]).setPendingCommission(newCommission);

        await expect(
          hydraDelegation.connect(this.signers.validators[0]).applyPendingCommission()
        ).to.be.revertedWithCustomError(hydraDelegation, "CommissionUpdateNotAvailable");
      });

      it("should apply pending commission", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

        const newCommission = MAX_COMMISSION.div(4);
        await hydraDelegation.connect(this.signers.validators[3]).setPendingCommission(newCommission);

        await time.increase(DAY * 15);

        await expect(hydraDelegation.connect(this.signers.validators[3]).applyPendingCommission())
          .to.emit(hydraDelegation, "CommissionUpdated")
          .withArgs(this.signers.validators[3].address, newCommission);

        expect(await hydraDelegation.delegationCommissionPerStaker(this.signers.validators[3].address)).to.equal(
          newCommission
        );
      });
    });

    describe("Change minDelegate", function () {
      it("should revert if non-governance address try to change MinDelegation", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        await expect(hydraDelegation.connect(this.signers.validators[0]).changeMinDelegation(this.minDelegation.mul(2)))
          .to.be.revertedWithCustomError(hydraDelegation, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.governanceArg);

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

      it("should claim delegator reward, but no commission if 0 when on base delegation", async function () {
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

        await expect(
          hydraDelegation.connect(this.signers.delegator).claimDelegatorReward(this.signers.validators[0].address)
        )
          .to.emit(hydraDelegation, "DelegatorRewardsClaimed")
          .withArgs(this.signers.validators[0].address, this.signers.delegator.address, reward);
      });

      it("should claim delegator reward and distribute commission when on base delegation", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        // set commission
        await setAndApplyCommission(hydraDelegation, this.signers.validators[0], 10);

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
        const commission = calculateCommissionCutFromDelegatorReward(
          reward,
          await hydraDelegation.delegationCommissionPerStaker(this.signers.validators[0].address)
        );

        // claim & check balance
        const balanceBeforeDelegator = await this.signers.delegator.getBalance();
        const distributedCommissionsBefore = await hydraDelegation.distributedCommissions(
          this.signers.validators[0].address
        );
        await expect(
          hydraDelegation.connect(this.signers.delegator).claimDelegatorReward(this.signers.validators[0].address)
        )
          .to.emit(hydraDelegation, "CommissionDistributed")
          .and.to.emit(hydraDelegation, "DelegatorRewardsClaimed");
        const balanceAfterDelegator = await this.signers.delegator.getBalance();
        const distributedCommissionsAfter = await hydraDelegation.distributedCommissions(
          this.signers.validators[0].address
        );
        expect(balanceAfterDelegator).to.be.gt(balanceBeforeDelegator.add(reward).mul(99).div(100));
        expect(balanceAfterDelegator).to.be.lt(balanceBeforeDelegator.add(reward).mul(101).div(100));
        expect(distributedCommissionsAfter).to.be.gt(distributedCommissionsBefore.add(commission).mul(99).div(100));
        expect(distributedCommissionsAfter).to.be.lt(distributedCommissionsBefore.add(commission).mul(101).div(100));
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
          await hydraDelegation.getRawReward(delegatedValidator.address, vestManager.address),
          "getRawReward"
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
          await hydraDelegation.getRawReward(delegatedValidator.address, vestManager.address),
          "getRawReward"
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
        const { epochNum, balanceChangeIndex } = await getClaimableRewardRPSData(
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
          .withArgs("_verifyRewardsMatured", ERRORS.vesting.invalidEpoch);

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
          .withArgs("_verifyRewardsMatured", ERRORS.vesting.wrongRPS);
      });

      it("should properly claim reward when not fully matured", async function () {
        const {
          systemHydraChain,
          hydraStaking,
          hydraDelegation,
          vestManager,
          vestManagerOwner,
          delegatedValidator,
          rewardWallet,
        } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

        // calculate position rewards
        const expectedReward = await calcExpectedPositionRewardForActivePosition(
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        // commit epoch, so more reward is added that must not be claimed now
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize,
          WEEK + 1
        );

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await getClaimableRewardRPSData(
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

        // Get raw reward before vesting
        const positionData = await hydraDelegation.vestedDelegationPositions(
          delegatedValidator.address,
          vestManager.address
        );
        const baseReward = await hydraDelegation.getRawReward(delegatedValidator.address, vestManager.address);
        const baseRewardAfterCommission = applyCommissionToReward(baseReward, positionData.commission);
        const base = await aprCalculator.BASE_APR();

        // calculate position rewards
        const expectedReward = await calcExpectedPositionRewardForActivePosition(
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        // more rewards to be distributed
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize,
          WEEK * 2 + 1
        );

        const validatorCurrentCommission = await hydraDelegation.delegationCommissionPerStaker(
          delegatedValidator.address
        );
        const additionalRewardBeforeCommission = (
          await hydraDelegation.getRawReward(delegatedValidator.address, vestManager.address)
        ).sub(baseRewardAfterCommission);

        const additionalReward = applyCommissionToReward(additionalRewardBeforeCommission, validatorCurrentCommission);

        const expectedAdditionalReward = base.mul(additionalReward).div(10000);
        const expectedFinalReward = expectedReward.add(expectedAdditionalReward);

        // prepare params for call
        const { position, epochNum, balanceChangeIndex } = await getClaimableRewardRPSData(
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
      // Todo: Commission
      it("should not distribute commission to the validator on claim for vested position with 0 commission", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation, vestManager, delegatedValidator } = await loadFixture(
          this.fixtures.weeklyVestedDelegationFixture
        );

        // commit epoch
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize,
          WEEK + DAY
        );

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await getClaimableRewardRPSData(
          systemHydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        // claim & check balance
        await expect(
          vestManager.claimVestedPositionReward(delegatedValidator.address, epochNum, balanceChangeIndex)
        ).to.not.emit(hydraDelegation, "CommissionClaimed");
      });

      it("should distribute the right commission to the validator on claim for vested position", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation, vestManager } = await loadFixture(
          this.fixtures.vestManagerFixture
        );
        const validator = this.signers.validators[2];
        const oldCommission = 10;
        await setAndApplyCommission(hydraDelegation, validator, oldCommission);
        const newCommission = oldCommission * 3;
        await hydraDelegation.connect(validator).setPendingCommission(newCommission);
        time.increase(DAY * 15);

        await vestManager.openVestedDelegatePosition(validator.address, 1, {
          value: this.minDelegation.mul(2),
        });
        // Commit epochs so rewards to be distributed
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], validator],
          5, // number of epochs to commit
          this.epochSize
        );

        // make sure that the vested position does not take the current commission, but the one at the time of delegation

        await hydraDelegation.connect(validator).applyPendingCommission();

        // commit epoch
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], validator],
          this.epochSize,
          WEEK * 2
        );

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await getClaimableRewardRPSData(
          systemHydraChain,
          hydraDelegation,
          validator.address,
          vestManager.address
        );

        // check claimable rewards for the position
        const rawReward = await hydraDelegation.getRawReward(validator.address, vestManager.address);
        const position = await hydraDelegation.vestedDelegationPositions(validator.address, vestManager.address);
        const rewardApr = applyVestingAPR(position.base, position.vestBonus, position.rsiBonus, rawReward);
        const commission = calculateCommissionCutFromFinalReward(rewardApr, hre.ethers.BigNumber.from(oldCommission));
        const commissionNew = calculateCommissionCutFromFinalReward(
          rewardApr,
          hre.ethers.BigNumber.from(newCommission)
        );

        // claim & check balance
        const distributedCommissionsBefore = await hydraDelegation.distributedCommissions(validator.address);
        await expect(vestManager.claimVestedPositionReward(validator.address, epochNum, balanceChangeIndex)).to.emit(
          hydraDelegation,
          "CommissionDistributed"
        );
        const distributedCommissionsAfter = await hydraDelegation.distributedCommissions(validator.address);
        // Commission should be less than the new commission and more than the old commission calculation
        expect(distributedCommissionsAfter).to.be.gt(distributedCommissionsBefore.add(commission));
        expect(distributedCommissionsAfter).to.be.lt(distributedCommissionsBefore.add(commissionNew));
      });
    });

    describe("Claim commission", function () {
      it("should revert when there is no commission to claim", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

        await expect(
          hydraDelegation.connect(this.signers.delegator).claimCommission(this.signers.delegator.address)
        ).to.be.revertedWithCustomError(hydraDelegation, "NoCommissionToClaim");
      });

      it("should claim commission and set it to 0", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        // set commission
        await setAndApplyCommission(hydraDelegation, this.signers.validators[0], 10);

        // claim & check balance
        await expect(
          hydraDelegation.connect(this.signers.delegator).claimDelegatorReward(this.signers.validators[0].address)
        ).to.emit(hydraDelegation, "CommissionDistributed");

        const commission = await hydraDelegation.distributedCommissions(this.signers.validators[0].address);
        expect(commission).to.be.gt(0);

        // claim & check balance
        await hydraDelegation.connect(this.signers.validators[0]).claimCommission(this.signers.validators[0].address);

        expect(await hydraDelegation.distributedCommissions(this.signers.validators[0].address)).to.be.eq(0);
      });

      it("should claim commission and emit event", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

        // set commission
        await setAndApplyCommission(hydraDelegation, this.signers.validators[0], 10);

        // claim & check balance
        await expect(
          hydraDelegation.connect(this.signers.delegator).claimDelegatorReward(this.signers.validators[0].address)
        ).to.emit(hydraDelegation, "CommissionDistributed");

        const commission = await hydraDelegation.distributedCommissions(this.signers.validators[0].address);
        expect(commission).to.be.gt(0);

        // claim & check balance
        await expect(
          hydraDelegation.connect(this.signers.validators[0]).claimCommission(this.signers.validators[0].address)
        )
          .to.emit(hydraDelegation, "CommissionClaimed")
          .withArgs(this.signers.validators[0].address, this.signers.validators[0].address, commission)
          .and.to.changeEtherBalance(this.signers.validators[0], commission);
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

    describe("Table driven tests for delegation rewards", async function () {
      it("should have less than 1% difference with delegation data table rewards", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation, vestingManagerFactory, validator1 } =
          await loadFixture(this.fixtures.initializedWithSpecificBonusesStateFixture);

        // Stake & Delegate
        await hydraStaking.connect(validator1).stake({ value: hre.ethers.utils.parseEther("150") });

        await hydraDelegation
          .connect(this.signers.delegator)
          .delegate(validator1.address, { value: hre.ethers.utils.parseEther("10") });

        const { newManager: manager1 } = await createNewVestManager(vestingManagerFactory, this.signers.accounts[4]);
        const { newManager: manager2 } = await createNewVestManager(vestingManagerFactory, this.signers.accounts[3]);

        await manager1.connect(this.signers.accounts[4]).openVestedDelegatePosition(validator1.address, 26, {
          value: hre.ethers.utils.parseEther("10"),
        });

        await manager2.connect(this.signers.accounts[3]).openVestedDelegatePosition(validator1.address, 52, {
          value: hre.ethers.utils.parseEther("10"),
        });

        // Commit epoch and distribute rewards
        const moreAccurateTime = Math.ceil((DAY * 1003) / 1000);
        await commitEpoch(systemHydraChain, hydraStaking, [validator1], this.epochSize, moreAccurateTime);
        const currEpochId = await systemHydraChain.currentEpochId();

        // Staker rewards without commission
        const stakerRewards = await hydraStaking.stakingRewards(validator1.address);
        expect(stakerRewards.total)
          .to.be.lt(Math.round((TABLE_DATA_REWARDS_FOR_STAKER[3] * 101) / 100))
          .and.gt(Math.round((TABLE_DATA_REWARDS_FOR_STAKER[3] * 99) / 100));

        // Delegator rewards
        const delegatorRewards1 = await hydraDelegation.getDelegatorReward(
          validator1.address,
          this.signers.delegator.address
        );
        expect(delegatorRewards1)
          .to.be.lt(Math.round((TABLE_DATA_REWARDS_FOR_DELEGATORS[0] * 101) / 100))
          .and.gt(Math.round((TABLE_DATA_REWARDS_FOR_DELEGATORS[0] * 99) / 100));
        const delegatorRewards2 = await hydraDelegation.calculatePositionTotalReward(
          validator1.address,
          manager1.address,
          currEpochId,
          1
        );
        expect(delegatorRewards2)
          .to.be.lt(Math.round((TABLE_DATA_REWARDS_FOR_DELEGATORS[1] * 101) / 100))
          .and.gt(Math.round((TABLE_DATA_REWARDS_FOR_DELEGATORS[1] * 99) / 100));
        const delegatorRewards3 = await hydraDelegation.calculatePositionTotalReward(
          validator1.address,
          manager2.address,
          currEpochId,
          1
        );
        expect(delegatorRewards3)
          .to.be.lt(Math.round((TABLE_DATA_REWARDS_FOR_DELEGATORS[2] * 101) / 100))
          .and.gt(Math.round((TABLE_DATA_REWARDS_FOR_DELEGATORS[2] * 99) / 100));
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
