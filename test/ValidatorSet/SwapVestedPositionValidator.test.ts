/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { DAY, ERRORS, WEEK } from "../constants";
import { commitEpoch, commitEpochs, retrieveRPSData } from "../helper";

export function RunSwapVestedPositionValidatorTests(): void {
  describe("Delegate position rewards", async function () {
    it("should revert when not the vest manager owner", async function () {
      const { vestManager, delegatedValidator } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      await expect(
        vestManager
          .connect(this.signers.accounts[10])
          .swapVestedPositionValidator(delegatedValidator.address, delegatedValidator.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert that the old position is inactive", async function () {
      const { systemValidatorSet, vestManager, delegatedValidator, rewardPool, vestManagerOwner } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      await commitEpoch(
        systemValidatorSet,
        rewardPool,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize,
        // increase time to make the position maturing
        WEEK
      );

      // ensure is not active position
      expect(await rewardPool.isActiveDelegatePosition(delegatedValidator.address, vestManager.address), "isActive").be
        .false;

      await expect(
        vestManager
          .connect(vestManagerOwner)
          .swapVestedPositionValidator(this.signers.validators[0].address, this.signers.validators[1].address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "OLD_POSITION_INACTIVE");
    });

    it("should revert when we try to swap to active position", async function () {
      const { vestManager, liquidToken, vestManagerOwner, rewardPool } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 1, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavilable);
    });

    it("should revert when we try to swap to new position which still matures", async function () {
      const { systemValidatorSet, vestManager, liquidToken, vestManagerOwner, rewardPool } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 2, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      // commit 8 epochs with 1 day increase before each, so, the first position gonna start maturing
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 8, this.epochSize, DAY);

      const newPosition = await rewardPool.delegationPositions(newValidator.address, vestManager.address);
      expect(newPosition.end.add(newPosition.duration).gt(await time.latest()), "Not matured").to.be.true;
      expect(newPosition.end.lt(await time.latest()), "isMaturing").to.be.true;

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavilable);
    });

    it("should revert when we try to swap to a position with left balance", async function () {
      const { systemValidatorSet, vestManager, liquidToken, vestManagerOwner, rewardPool } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 5, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      // commit 5 epochs with 3 days increase before each, so, the new position will be matured and have some balance left
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 5, this.epochSize, DAY * 3);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        newValidator.address,
        vestManager.address
      );

      // claim rewards only
      await vestManager.connect(vestManagerOwner).claimVestedPositionReward(newValidator.address, epochNum, topUpIndex);

      // verify that there is delegated balance left
      expect(await rewardPool.delegationOf(newValidator.address, vestManager.address), "delegationOf").to.not.be.eq(0);

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavilable);
    });

    it("should revert when we try to swap to a position with left rewards to claim", async function () {
      const { systemValidatorSet, vestManager, liquidToken, vestManagerOwner, rewardPool } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 5, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      // commit 5 epochs with 3 days increase before each, so, the new position will be matured and have some balance left
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 5, this.epochSize, DAY * 3);

      // undelegate full amount
      await vestManager.connect(vestManagerOwner).cutVestedDelegatePosition(newValidator.address, this.minDelegation);

      // verify that there are rewards left to claim
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        newValidator.address,
        vestManager.address
      );

      expect(
        await rewardPool.getDelegatorPositionReward(newValidator.address, vestManager.address, epochNum, topUpIndex),
        "getDelegatorPositionReward"
      ).to.not.be.eq(0);

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavilable);
    });

    it("should transfer old position parameters to the new one on successful swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, liquidToken } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const validator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];

      const vestingDuration = 2; // 2 weeks
      await vestManager.connect(vestManagerOwner).openVestedDelegatePosition(validator.address, vestingDuration, {
        value: this.minDelegation.mul(2),
      });

      await commitEpoch(systemValidatorSet, rewardPool, [validator, newValidator], this.epochSize);

      const amount = await rewardPool.delegationOf(validator.address, vestManager.address);

      // give allowance & swap
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);
      await vestManager.connect(vestManagerOwner).swapVestedPositionValidator(validator.address, newValidator.address);

      const oldPosition = await rewardPool.delegationPositions(validator.address, vestManager.address);
      const newPosition = await rewardPool.delegationPositions(newValidator.address, vestManager.address);

      // expect new position to be like the old position
      expect(oldPosition.duration, "oldPosition.duration").to.be.eq(newPosition.duration);
      expect(oldPosition.start, "oldPosition.start").to.be.eq(newPosition.start);
      expect(oldPosition.end, "oldPosition.end").to.be.eq(newPosition.end);
      expect(oldPosition.base, "oldPosition.base").to.be.eq(newPosition.base);
      expect(oldPosition.vestBonus, "oldPosition.vestBonus").to.be.eq(newPosition.vestBonus);
      expect(oldPosition.rsiBonus, "oldPosition.rsiBonus").to.be.eq(newPosition.rsiBonus);
    });

    it("should start earning rewards on new position after swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, oldValidator, newValidator } = await loadFixture(
        this.fixtures.swappedPositionFixture
      );

      await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize);

      const rewardsAfterSwap = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsAfterSwap, "rewardsAfterSwap").to.be.gt(0);
    });

    it("should stop earning rewards on old position after swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, oldValidator, newValidator, rewardsBeforeSwap } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize);

      const rewardsAfterSwap = await rewardPool.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsAfterSwap, "rewardsAfterSwap").to.be.eq(rewardsBeforeSwap).and.to.be.gt(0);
    });

    it("should revert when pass incorrect swap index", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, oldValidator, newValidator } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 4, this.epochSize, WEEK);

      const rewardsBeforeClaim = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsBeforeClaim).to.be.gt(0);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        newValidator.address,
        vestManager.address
      );

      await expect(
        vestManager.connect(vestManagerOwner).claimVestedPositionReward(newValidator.address, epochNum, topUpIndex + 1)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("vesting", "INVALID_TOP_UP_INDEX");
    });

    it("should claim all rewards from the new position after swap", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, oldValidator, newValidator } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 4, this.epochSize, WEEK);

      const rewardsBeforeClaim = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsBeforeClaim).to.be.gt(0);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        newValidator.address,
        vestManager.address
      );

      await vestManager.connect(vestManagerOwner).claimVestedPositionReward(newValidator.address, epochNum, topUpIndex);

      const rewardsAfterClaim = await rewardPool.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsAfterClaim).to.be.eq(0);
    });

    it("should claim all rewards from the old position after swap when the reward is matured", async function () {
      const { systemValidatorSet, rewardPool, vestManager, vestManagerOwner, oldValidator, newValidator } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemValidatorSet, rewardPool, [oldValidator, newValidator], 3, this.epochSize, WEEK);

      const rewardsBeforeClaim = await rewardPool.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsBeforeClaim, "rewardsBeforeClaim").to.be.gt(0);

      // prepare params for call
      const { epochNum, topUpIndex } = await retrieveRPSData(
        systemValidatorSet,
        rewardPool,
        oldValidator.address,
        vestManager.address
      );

      await vestManager.connect(vestManagerOwner).claimVestedPositionReward(oldValidator.address, epochNum, topUpIndex);

      const rewardsAfterClaim = await rewardPool.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsAfterClaim, "rewardsAfterClaim").to.be.eq(0);
    });

    it("should revert when try to swap again during the same epoch", async function () {
      const {
        rewardPool,
        vestManager,
        vestManagerOwner,
        newValidator: oldValidator,
        liquidToken,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      const newValidator = this.signers.validators[2];
      const amount = await rewardPool.delegationOf(oldValidator.address, vestManager.address);

      // give allowance
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);

      // try to swap
      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("_saveAccountParamsChange", "BALANCE_CHANGE_ALREADY_MADE");
    });

    // TODO: Consider deleting it as we shouldn't be getting into that case
    it.skip("should revert when try to swap too many times", async function () {
      const {
        systemValidatorSet,
        rewardPool,
        vestManager,
        vestManagerOwner,
        newValidator: oldValidator,
        liquidToken,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      const newValidator = this.signers.validators[2];

      await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize, 60 * 60);

      const amount = await rewardPool.delegationOf(oldValidator.address, vestManager.address);

      const balanceChangesThreshold = (await rewardPool.balanceChangeThreshold()).toNumber();
      for (let i = 0; i < balanceChangesThreshold; i++) {
        const _oldValidator = i % 2 === 0 ? oldValidator : newValidator;
        const _newValidator = i % 2 === 0 ? newValidator : oldValidator;

        // give allowance
        await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);
        await vestManager
          .connect(vestManagerOwner)
          .swapVestedPositionValidator(_oldValidator.address, _newValidator.address);
        await commitEpoch(systemValidatorSet, rewardPool, [oldValidator, newValidator], this.epochSize, 60 * 60);
      }

      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, amount);

      // try to swap to exceed the number of the allowed balance changes
      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(rewardPool, "DelegateRequirement")
        .withArgs("_saveAccountParamsChange", "BALANCE_CHANGES_EXCEEDED");
    });
  });
}
