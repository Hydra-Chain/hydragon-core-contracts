/* eslint-disable node/no-extraneous-import */
import { loadFixture, impersonateAccount, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

// eslint-disable-next-line camelcase
import { VestManager__factory } from "../../typechain-types";
import { ERRORS, VESTING_DURATION_WEEKS, WEEK, DEADLINE } from "../constants";
import { calculatePenalty, claimPositionRewards, commitEpochs, getUserManager, getPermitSignature } from "../helper";
import {
  RunDelegateClaimTests,
  RunVestedDelegateClaimTests,
  RunVestedDelegationRewardsTests,
  RunDelegateFunctionsByValidatorSet,
} from "../RewardPool/RewardPool.test";
import { RunSwapVestedPositionValidatorTests } from "./SwapVestedPositionValidator.test";

export function RunDelegationTests(): void {
  describe("Change minDelegate", function () {
    it("should revert if non-default_admin_role address try to change MinDelegation", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const adminRole = await rewardPool.DEFAULT_ADMIN_ROLE();

      await expect(
        rewardPool.connect(this.signers.validators[0]).changeMinDelegation(this.minDelegation.mul(2))
      ).to.be.revertedWith(ERRORS.accessControl(this.signers.validators[0].address.toLocaleLowerCase(), adminRole));

      expect(await rewardPool.minDelegation()).to.be.equal(this.minDelegation);
    });

    it("should revert if MinDelegation is too low", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const newLowMinDelegation = this.minStake.div(2);

      await expect(
        rewardPool.connect(this.signers.governance).changeMinDelegation(newLowMinDelegation)
      ).to.be.revertedWithCustomError(rewardPool, "InvalidMinDelegation");

      expect(await rewardPool.minDelegation()).to.be.equal(this.minDelegation);
    });

    it("should change MinDelegation by default_admin_role address", async function () {
      const { rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const newMinDelegation = this.minDelegation.mul(2);

      await expect(rewardPool.connect(this.signers.governance).changeMinDelegation(newMinDelegation)).to.not.be
        .reverted;

      expect(await rewardPool.minDelegation()).to.be.equal(newMinDelegation);
    });
  });

  describe("Delegate", function () {
    it("should revert when delegating zero amount", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(validatorSet.delegate(this.signers.validators[0].address, { value: 0 }))
        .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
        .withArgs("delegate", "DELEGATING_AMOUNT_ZERO");
    });

    it("should not be able to delegate to  inactive validator", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(validatorSet.delegate(this.signers.validators[3].address, { value: this.minDelegation }))
        .to.be.revertedWithCustomError(validatorSet, "Unauthorized")
        .withArgs(ERRORS.inactiveValidator);
    });

    it("should not be able to delegate less than minDelegation", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(
        validatorSet.delegate(this.signers.validators[0].address, {
          value: this.minDelegation.div(2),
        })
      )
        .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
        .withArgs("delegate", "DELEGATION_TOO_LOW");
    });

    it("should delegate for the first time", async function () {
      const { validatorSet, rewardPool } = await loadFixture(this.fixtures.withdrawableFixture);
      const delegateAmount = this.minDelegation.mul(2);

      const tx = await validatorSet.connect(this.signers.delegator).delegate(this.signers.validators[0].address, {
        value: delegateAmount,
      });

      await expect(tx)
        .to.emit(validatorSet, "Delegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegateAmount);

      const delegatedAmount = await rewardPool.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      expect(delegatedAmount).to.equal(delegateAmount);
    });

    it("should delegate again and register a withdrawal for the claimed rewards automatically", async function () {
      const { validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const delegateAmount = this.minDelegation.div(2);
      const delegatorReward = await rewardPool.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      const tx = await validatorSet.connect(this.signers.delegator).delegate(this.signers.validators[0].address, {
        value: delegateAmount,
      });

      await expect(tx, "DelegatorRewardClaimed")
        .to.emit(rewardPool, "DelegatorRewardClaimed")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegatorReward);

      await expect(tx, "RewardsWithdrawn")
        .to.emit(rewardPool, "RewardsWithdrawn")
        .withArgs(this.signers.delegator.address, delegatorReward);

      await expect(tx, "Delegated")
        .to.emit(validatorSet, "Delegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegateAmount);
    });
  });

  describe("Reward Pool - Delegate claim", function () {
    RunDelegateClaimTests();
  });

  describe("Undelegate", async function () {
    it("should not be able to undelegate more than the delegated amount", async function () {
      const { validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);
      const delegatedAmount = await rewardPool.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      await expect(
        validatorSet
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, delegatedAmount.add(1))
      )
        .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
        .withArgs("undelegate", "INSUFFICIENT_BALANCE");
    });

    it("should not be able to undelegate such amount, so the left delegation is lower than minDelegation", async function () {
      const { validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);
      const delegatedAmount = await rewardPool.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      await expect(
        validatorSet
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, delegatedAmount.sub(1))
      )
        .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
        .withArgs("undelegate", "DELEGATION_TOO_LOW");
    });

    it("should not be able to exploit int overflow", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.delegatedFixture);

      await expect(
        validatorSet
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, hre.ethers.constants.MaxInt256.add(1))
      ).to.be.reverted;
    });

    it("should partially undelegate", async function () {
      const { validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const delegatedAmount = await rewardPool.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const expectedReward = await rewardPool.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const undelegateAmount = this.minDelegation.div(2);
      const tx = await validatorSet
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[0].address, undelegateAmount);

      await expect(tx, "WithdrawalRegistered")
        .to.emit(validatorSet, "WithdrawalRegistered")
        .withArgs(this.signers.delegator.address, undelegateAmount);

      await expect(tx, "RewardsWithdrawn")
        .to.emit(rewardPool, "RewardsWithdrawn")
        .withArgs(this.signers.delegator.address, expectedReward);

      await expect(tx, "Undelegated")
        .to.emit(validatorSet, "Undelegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, undelegateAmount);

      const delegatedAmountLeft = await rewardPool.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      expect(delegatedAmountLeft, "delegatedAmountLeft").to.equal(delegatedAmount.sub(undelegateAmount));
    });

    it("should completely undelegate", async function () {
      const { validatorSet, rewardPool } = await loadFixture(this.fixtures.delegatedFixture);

      const delegatedAmount = await rewardPool.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const expectedReward = await rewardPool.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const tx = await validatorSet
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[0].address, delegatedAmount);

      await expect(tx, "WithdrawalRegistered")
        .to.emit(validatorSet, "WithdrawalRegistered")
        .withArgs(this.signers.delegator.address, delegatedAmount);

      await expect(tx, "RewardsWithdrawn")
        .to.emit(rewardPool, "RewardsWithdrawn")
        .withArgs(this.signers.delegator.address, expectedReward);

      await expect(tx, "Undelegated")
        .to.emit(validatorSet, "Undelegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegatedAmount);

      const delegatedAmountLeft = await rewardPool.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      expect(delegatedAmountLeft, "delegatedAmountLeft").to.equal(0);
    });
  });

  describe("Delegation Vesting", async function () {
    before(async function () {
      // validator[2] delegates minDelegation and validator[1] delegates minDelegation.mul(2)
      // put them into the context in order to use it in the reward pool tests
      this.delegatedValidators = [this.signers.validators[2].address, this.signers.validators[1].address];
      this.vestManagerOwners = [this.signers.accounts[4], this.signers.accounts[5]];
    });

    it("should have created a base implementation", async function () {
      const { validatorSet } = await loadFixture(this.fixtures.vestManagerFixture);

      const baseImplementation = await validatorSet.implementation();
      expect(baseImplementation).to.not.equal(hre.ethers.constants.AddressZero);
    });

    describe("newManager()", async function () {
      it("should revert when zero address", async function () {
        const { validatorSet, rewardPool } = await loadFixture(this.fixtures.vestManagerFixture);

        const zeroAddress = hre.ethers.constants.AddressZero;
        await impersonateAccount(zeroAddress);
        const zeroAddrSigner = await hre.ethers.getSigner(zeroAddress);
        await expect(validatorSet.connect(zeroAddrSigner).newManager(rewardPool.address)).to.be.revertedWith(
          "INVALID_OWNER"
        );
      });

      it("should successfully create new manager", async function () {
        const { validatorSet, rewardPool } = await loadFixture(this.fixtures.vestManagerFixture);

        const tx = await validatorSet.connect(this.signers.accounts[5]).newManager(rewardPool.address);
        const receipt = await tx.wait();
        const event = receipt.events?.find((e: any) => e.event === "NewClone");
        const address = event?.args?.newClone;

        expect(address).to.not.equal(hre.ethers.constants.AddressZero);
      });

      it("should have initialized the manager", async function () {
        const { validatorSet, vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        expect(await vestManager.owner(), "owner").to.equal(this.vestManagerOwners[0].address);
        expect(await vestManager.delegation(), "delegation").to.equal(validatorSet.address);
      });

      it("should set manager in mappings", async function () {
        const { validatorSet, vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        expect(await validatorSet.vestManagers(vestManager.address), "vestManagers").to.equal(
          this.vestManagerOwners[0].address
        );
        expect(await validatorSet.userVestManagers(this.vestManagerOwners[0].address, 0), "userVestManagers").to.equal(
          vestManager.address
        );
        expect(
          (await validatorSet.getUserVestManagers(this.vestManagerOwners[0].address)).length,
          "getUserVestManagers"
        ).to.equal(1);
      });
    });

    describe("openVestedDelegatePosition()", async function () {
      it("should revert when not manager", async function () {
        const { validatorSet } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(
          validatorSet.connect(this.signers.accounts[3]).delegateWithVesting(this.signers.accounts[3].address, 1)
        ).to.be.revertedWithCustomError(validatorSet, "NotVestingManager");
      });

      it("should revert when validator is inactive", async function () {
        const { validatorSet, vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(
          vestManager
            .connect(this.vestManagerOwners[0])
            .openVestedDelegatePosition(this.signers.accounts[10].address, 1, {
              value: this.minDelegation,
            })
        )
          .to.be.revertedWithCustomError(validatorSet, "Unauthorized")
          .withArgs(ERRORS.inactiveValidator);
      });

      it("should revert when delegation too low", async function () {
        const { validatorSet, vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(
          vestManager
            .connect(this.vestManagerOwners[0])
            .openVestedDelegatePosition(this.signers.validators[2].address, 1, {
              value: this.minDelegation.div(2),
            })
        )
          .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
          .withArgs("vesting", "DELEGATION_TOO_LOW");
      });

      it("should properly open vesting position", async function () {
        const { vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        const vestingDuration = 52; // in weeks
        await expect(
          await vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
            value: this.minDelegation,
          })
        ).to.not.be.reverted;
      });

      it("should revert when maturing position", async function () {
        const { validatorSet, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // enter the reward maturity phase
        await time.increase(WEEK * VESTING_DURATION_WEEKS + 1);

        await expect(
          vestManager.openVestedDelegatePosition(this.delegatedValidators[0], VESTING_DURATION_WEEKS, {
            value: this.minDelegation,
          })
        )
          .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
          .withArgs("vesting", "POSITION_MATURING");
      });

      it("should revert when active position", async function () {
        const { validatorSet, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        const vestingDuration = 52; // in weeks
        await expect(
          vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
            value: this.minDelegation,
          })
        )
          .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
          .withArgs("vesting", "POSITION_ACTIVE");
      });

      it("should revert when reward not claimed", async function () {
        const { validatorSet, rewardPool, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // go beyond vesting period and maturing phases
        await time.increase(WEEK * 110);

        const vestingDuration = 52; // in weeks
        const currentReward = await rewardPool.getRawDelegatorReward(
          this.signers.validators[2].address,
          vestManager.address
        );

        expect(currentReward, "currentReward").to.be.gt(0);
        await expect(
          vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
            value: this.minDelegation,
          })
        )
          .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
          .withArgs("vesting", "REWARDS_NOT_CLAIMED");
      });

      it("should successfully open vesting position again", async function () {
        const { validatorSet, rewardPool, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // go beyond vesting period and maturing phases
        await time.increase(WEEK * 110);

        const vestingDuration = 52; // in weeks
        let currentReward = await rewardPool.getRawDelegatorReward(
          this.signers.validators[2].address,
          vestManager.address
        );

        await claimPositionRewards(validatorSet, rewardPool, vestManager, this.delegatedValidators[0]);

        currentReward = await rewardPool.getRawDelegatorReward(this.signers.validators[2].address, vestManager.address);
        expect(currentReward, "currentReward").to.be.equal(0);

        const delegatedAmount = await rewardPool.delegationOf(this.delegatedValidators[0], vestManager.address);
        const amountToDelegate = this.minDelegation.mul(2);
        const tx = await vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
          value: amountToDelegate,
        });

        await expect(tx)
          .to.emit(validatorSet, "PositionOpened")
          .withArgs(vestManager.address, this.delegatedValidators[0], vestingDuration, amountToDelegate);

        expect(await rewardPool.delegationOf(this.delegatedValidators[0], vestManager.address)).to.be.equal(
          delegatedAmount.add(amountToDelegate)
        );
      });
    });

    describe("cutVestedDelegatePosition()", async function () {
      it("should revert when insufficient balance", async function () {
        const { validatorSet, rewardPool, vestManager, liquidToken } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const balance = await rewardPool.delegationOf(this.delegatedValidators[0], vestManager.address);

        // send one more token so liquid tokens balance is enough
        const user2 = this.signers.accounts[7];
        await validatorSet.connect(user2).newManager(rewardPool.address);
        const VestManagerFactory = new VestManager__factory(this.vestManagerOwners[0]);
        const manager2 = await getUserManager(validatorSet, user2, VestManagerFactory);
        await manager2.openVestedDelegatePosition(this.delegatedValidators[0], 1, {
          value: this.minDelegation.mul(2),
        });

        await liquidToken.connect(user2).transfer(this.vestManagerOwners[0].address, 1);
        const balanceToCut = balance.add(1);
        await liquidToken.connect(this.vestManagerOwners[0]).approve(vestManager.address, balanceToCut);

        await expect(vestManager.cutVestedDelegatePosition(this.delegatedValidators[0], balanceToCut))
          .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
          .withArgs("vesting", "INSUFFICIENT_BALANCE");
      });

      it("should revert when delegation too low", async function () {
        const { validatorSet, rewardPool, vestManager, liquidToken } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const balance = await rewardPool.delegationOf(this.delegatedValidators[0], vestManager.address);
        const balanceToCut = balance.sub(1);
        await liquidToken.connect(this.vestManagerOwners[0]).approve(vestManager.address, balanceToCut);
        await expect(vestManager.cutVestedDelegatePosition(this.delegatedValidators[0], balanceToCut))
          .to.be.revertedWithCustomError(validatorSet, "DelegateRequirement")
          .withArgs("vesting", "DELEGATION_TOO_LOW");
      });

      it("should get staker penalty and rewards that will be burned, if closing from active position", async function () {
        const { systemValidatorSet, rewardPool, vestManager, delegatedValidator } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        // commit some more epochs to generate additional rewards
        await commitEpochs(
          systemValidatorSet,
          rewardPool,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          5, // number of epochs to commit
          this.epochSize
        );

        const position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);
        const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());

        // get the penalty and reward from the contract
        const penalty = await rewardPool.calculatePositionPenalty(
          delegatedValidator.address,
          vestManager.address,
          this.minStake
        );
        const reward = await rewardPool.calculateTotalPositionReward(delegatedValidator.address, vestManager.address);

        // calculate penalty locally
        const calculatedPenalty = await calculatePenalty(position, latestTimestamp, this.minStake);

        expect(penalty, "penalty").to.be.gt(0);
        expect(penalty, "penalty = calculatedPenalty").to.be.equal(calculatedPenalty);
        expect(reward, "reward").to.be.gt(0);
      });

      it("should slash the amount when in active position", async function () {
        const { rewardPool, liquidToken, vestManager, vestManagerOwner, delegatedValidator } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        // ensure position is active
        const isActive = await rewardPool.isActiveDelegatePosition(delegatedValidator.address, vestManager.address);
        expect(isActive, "isActive").to.be.true;

        // check is amount properly removed from delegation
        const delegatedBalanceBefore = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);

        const cutAmount = delegatedBalanceBefore.div(2);
        const position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);

        // Hydra TODO: Create table-driven unit tests with precalculated values to test the exact amounts
        // check if amount is properly burned
        // const end = position.end;
        // const rpsValues = await childValidatorSet.getRPSValues(validator);
        // const epochNum = findProperRPSIndex(rpsValues, end);
        // const balanceChangeIndex = 0;
        // let reward = await childValidatorSet.getDelegatorPositionReward(
        //   validator,
        //   manager.address,
        //   epochNum,
        //   balanceChangeIndex
        // );
        // reward = await childValidatorSet.applyMaxReward(reward);
        // const decrease = reward.add(amountToBeBurned);
        // await expect(manager.cutVestedDelegatePosition(validator, cutAmount)).to.changeEtherBalance(
        //   childValidatorSet,
        //   decrease.mul(-1)
        // );

        await liquidToken.connect(vestManagerOwner).approve(vestManager.address, cutAmount);

        const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());
        const nextTimestamp = latestTimestamp.add(2);
        await time.setNextBlockTimestamp(nextTimestamp);
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, cutAmount);
        const penalty = await calculatePenalty(position, nextTimestamp, cutAmount);

        const delegatedBalanceAfter = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);
        expect(delegatedBalanceAfter, "delegatedBalanceAfter").to.be.eq(delegatedBalanceBefore.sub(cutAmount));

        // claimableRewards must be 0
        const claimableRewards = await rewardPool.getRawDelegatorReward(
          delegatedValidator.address,
          vestManager.address
        );
        expect(claimableRewards, "claimableRewards").to.be.eq(0);

        // check if amount is properly slashed
        const balanceBefore = await vestManagerOwner.getBalance();

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        // should slash the delegator with the calculated penalty
        // cut half of the requested amount because half of the vesting period is still not passed
        expect(balanceAfter.sub(balanceBefore), "left balance").to.be.eq(cutAmount.sub(penalty));
        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(cutAmount.sub(penalty)));
      });

      it("should slash when undelegates exactly 1 week after the start of the vested position", async function () {
        const { rewardPool, liquidToken, vestManager, vestManagerOwner, delegatedValidator } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        // ensure position is active
        const isActive = await rewardPool.isActiveDelegatePosition(delegatedValidator.address, vestManager.address);
        expect(isActive, "isActive").to.be.true;

        // check is amount properly removed from delegation
        const delegatedBalance = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);
        const position = await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address);

        await liquidToken.connect(vestManagerOwner).approve(vestManager.address, delegatedBalance);

        const nextTimestamp = position.start.add(WEEK);
        await time.setNextBlockTimestamp(nextTimestamp);
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedBalance);

        // hardcode the penalty percent by 0.3% a week (9 weeks should be left)
        const bps = 9 * 30;
        const penalty = delegatedBalance.mul(bps).div(10000);

        const delegatedBalanceAfter = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);
        expect(delegatedBalanceAfter, "delegatedBalanceAfter").to.be.eq(0);

        // claimableRewards must be 0
        const claimableRewards = await rewardPool.getRawDelegatorReward(
          delegatedValidator.address,
          vestManager.address
        );
        expect(claimableRewards, "claimableRewards").to.be.eq(0);

        // check if amount is properly slashed
        const balanceBefore = await vestManagerOwner.getBalance();

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        // should slash the delegator with the calculated penalty
        expect(balanceAfter.sub(balanceBefore), "left balance").to.be.eq(delegatedBalance.sub(penalty));
        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(delegatedBalance.sub(penalty)));
      });

      it("should properly cut position", async function () {
        const { systemValidatorSet, rewardPool, liquidToken, vestManager, vestManagerOwner, delegatedValidator } =
          await loadFixture(this.fixtures.vestedDelegationFixture);

        // commit Epoch so reward is made
        await commitEpochs(
          systemValidatorSet,
          rewardPool,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          3,
          this.epochSize
        );

        const reward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        expect(reward, "reward").to.not.be.eq(0);

        // Finish the vesting period
        await time.increase(WEEK * 60);

        const balanceBefore = await vestManagerOwner.getBalance();
        const delegatedBalance = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);
        expect(delegatedBalance, "delegatedBalance").to.not.be.eq(0);

        await liquidToken.connect(vestManagerOwner).approve(vestManager.address, delegatedBalance);
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedBalance);

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(delegatedBalance));

        // check is amount properly removed from delegation
        expect(await rewardPool.delegationOf(delegatedValidator.address, vestManager.address)).to.be.eq(0);

        // ensure reward is still available for withdrawal
        const rewardAfter = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        expect(rewardAfter).to.be.eq(reward);
      });

      it("should delete position when closing it", async function () {
        const { rewardPool, liquidToken, vestManager, vestManagerOwner, delegatedValidator } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        // cut the whole position
        const delegatedAmount = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);
        await liquidToken.connect(vestManagerOwner).approve(vestManager.address, delegatedAmount);
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedAmount);
        expect((await rewardPool.delegationPositions(delegatedValidator.address, vestManager.address)).start).to.be.eq(
          0
        );
      });
    });

    describe("cutVestedDelegatePositionWithPermit()", async function () {
      it("should revert on wrong deadline", async function () {
        const { validatorSet, rewardPool, vestManager, liquidToken } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const balance = await rewardPool.delegationOf(this.delegatedValidators[0], vestManager.address);

        // send one more token so liquid tokens balance is enough
        const user2 = this.signers.accounts[7];
        await validatorSet.connect(user2).newManager(rewardPool.address);
        const VestManagerFactory = new VestManager__factory(this.vestManagerOwners[0]);
        const manager2 = await getUserManager(validatorSet, user2, VestManagerFactory);
        await manager2.openVestedDelegatePosition(this.delegatedValidators[0], 1, {
          value: this.minDelegation.mul(2),
        });

        await liquidToken.connect(user2).transfer(this.vestManagerOwners[0].address, 1);
        const balanceToCut = balance.add(1);
        const { v, r, s } = await getPermitSignature(
          this.vestManagerOwners[0],
          liquidToken,
          vestManager.address,
          balanceToCut,
          DEADLINE
        );

        await expect(
          vestManager.cutVestedDelegatePositionWithPermit(this.delegatedValidators[0], balanceToCut, "1242144", v, r, s)
        ).to.be.revertedWith("ERC20Permit: expired deadline");
      });

      it("should revert on wrong signature", async function () {
        const { validatorSet, rewardPool, vestManager, liquidToken } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const balance = await rewardPool.delegationOf(this.delegatedValidators[0], vestManager.address);

        // send one more token so liquid tokens balance is enough
        const user2 = this.signers.accounts[7];
        await validatorSet.connect(user2).newManager(rewardPool.address);
        const VestManagerFactory = new VestManager__factory(this.vestManagerOwners[0]);
        const manager2 = await getUserManager(validatorSet, user2, VestManagerFactory);
        await manager2.openVestedDelegatePosition(this.delegatedValidators[0], 1, {
          value: this.minDelegation.mul(2),
        });

        await liquidToken.connect(user2).transfer(this.vestManagerOwners[0].address, 1);
        const balanceToCut = balance.add(1);
        const { v, r, s } = await getPermitSignature(
          this.vestManagerOwners[0],
          liquidToken,
          vestManager.address,
          balanceToCut,
          DEADLINE
        );

        await expect(
          vestManager.cutVestedDelegatePositionWithPermit(
            this.delegatedValidators[0],
            balanceToCut.add(1),
            DEADLINE,
            v,
            r,
            s
          )
        ).to.be.revertedWith("ERC20Permit: invalid signature");
      });

      it("should properly cut position with permit", async function () {
        const { systemValidatorSet, rewardPool, liquidToken, vestManager, vestManagerOwner, delegatedValidator } =
          await loadFixture(this.fixtures.vestedDelegationFixture);

        // commit Epoch so reward is made
        await commitEpochs(
          systemValidatorSet,
          rewardPool,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          3,
          this.epochSize
        );

        const reward = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        expect(reward, "reward").to.not.be.eq(0);

        // Finish the vesting period
        await time.increase(WEEK * 60);

        const balanceBefore = await vestManagerOwner.getBalance();
        const delegatedBalance = await rewardPool.delegationOf(delegatedValidator.address, vestManager.address);
        expect(delegatedBalance, "delegatedBalance").to.not.be.eq(0);

        const { v, r, s } = await getPermitSignature(
          vestManagerOwner,
          liquidToken,
          vestManager.address,
          delegatedBalance,
          DEADLINE
        );
        await vestManager.cutVestedDelegatePositionWithPermit(
          delegatedValidator.address,
          delegatedBalance,
          DEADLINE,
          v,
          r,
          s
        );

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(delegatedBalance));

        // check is amount properly removed from delegation
        expect(await rewardPool.delegationOf(delegatedValidator.address, vestManager.address)).to.be.eq(0);

        // ensure reward is still available for withdrawal
        const rewardAfter = await rewardPool.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        expect(rewardAfter).to.be.eq(reward);
      });
    });

    describe("Reward Pool - rewards", async function () {
      RunVestedDelegationRewardsTests();
    });

    describe("Reward Pool - Vested delegate claim", async function () {
      RunVestedDelegateClaimTests();
    });

    describe("Reward Pool - Vested delegate swap", async function () {
      RunSwapVestedPositionValidatorTests();
    });

    describe("Reward Pool - ValidatorSet protected delegate functions", function () {
      RunDelegateFunctionsByValidatorSet();
    });
  });
}
