/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { DAY, ERRORS, WEEK } from "../constants";
import { commitEpoch, commitEpochs, retrieveRPSData } from "../helper";

export function RunSwapVestedPositionValidatorTests(): void {
  describe("Vested position swap", async function () {
    it("should revert when not the vest manager owner", async function () {
      const { vestManager, delegatedValidator } = await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      await expect(
        vestManager
          .connect(this.signers.accounts[10])
          .swapVestedPositionValidator(delegatedValidator.address, delegatedValidator.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert if we try to swap to inActive validator", async function () {
      const { systemHydraChain, vestManager, delegatedValidator, hydraStaking, vestManagerOwner } = await loadFixture(
        this.fixtures.weeklyVestedDelegationFixture
      );

      await commitEpoch(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize,
        DAY
      );

      await expect(
        vestManager
          .connect(vestManagerOwner)
          .swapVestedPositionValidator(delegatedValidator.address, vestManagerOwner.address)
      )
        .to.be.revertedWithCustomError(hydraStaking, "Unauthorized")
        .withArgs("INACTIVE_STAKER");
    });

    it("should revert that the old position is inactive", async function () {
      const { systemHydraChain, vestManager, delegatedValidator, hydraDelegation, vestManagerOwner, hydraStaking } =
        await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

      await commitEpoch(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
        this.epochSize,
        // increase time to make the position maturing
        WEEK
      );

      // ensure is not active position
      expect(
        await hydraDelegation.isActiveDelegatePosition(delegatedValidator.address, vestManager.address),
        "isActive"
      ).be.false;

      await expect(
        vestManager
          .connect(vestManagerOwner)
          .swapVestedPositionValidator(this.signers.validators[0].address, this.signers.validators[1].address)
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("vesting", "OLD_POSITION_INACTIVE");
    });

    it("should revert when we try to swap to active position", async function () {
      const { vestManager, vestManagerOwner, hydraDelegation } = await loadFixture(this.fixtures.vestManagerFixture);

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 1, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavailable);
    });

    it("should revert when we try to swap to new position which still matures", async function () {
      const { systemHydraChain, vestManager, vestManagerOwner, hydraDelegation, hydraStaking } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 2, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      // commit 8 epochs with 1 day increase before each, so, the first position gonna start maturing
      await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 8, this.epochSize, DAY);

      const newPosition = await hydraDelegation.vestedDelegationPositions(newValidator.address, vestManager.address);
      expect(newPosition.end.add(newPosition.duration).gt(await time.latest()), "Not matured").to.be.true;
      expect(newPosition.end.lt(await time.latest()), "isMaturing").to.be.true;

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavailable);
    });

    it("should revert when we try to swap to a position with left balance", async function () {
      const { systemHydraChain, vestManager, vestManagerOwner, hydraDelegation, hydraStaking } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 5, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      // commit 5 epochs with 3 days increase before each, so, the new position will be matured and have some balance left
      await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 5, this.epochSize, DAY * 3);

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        systemHydraChain,
        hydraDelegation,
        newValidator.address,
        vestManager.address
      );

      // claim rewards only
      await vestManager
        .connect(vestManagerOwner)
        .claimVestedPositionReward(newValidator.address, epochNum, balanceChangeIndex);

      // verify that there is delegated balance left
      expect(
        await hydraDelegation.delegationOf(newValidator.address, vestManager.address),
        "delegationOf"
      ).to.not.be.eq(0);

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavailable);
    });

    it("should revert when we try to swap to a position with left rewards to claim", async function () {
      const { systemHydraChain, vestManager, liquidToken, vestManagerOwner, hydraDelegation, hydraStaking } =
        await loadFixture(this.fixtures.vestManagerFixture);

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 5, { value: this.minDelegation });
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(newValidator.address, 1, { value: this.minDelegation });

      // commit 5 epochs with 3 days increase before each, so, the new position will be matured and have some balance left
      await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 5, this.epochSize, DAY * 3);

      // give allowance & undelegate full amount
      await liquidToken.connect(vestManagerOwner).approve(vestManager.address, this.minDelegation);
      await vestManager.connect(vestManagerOwner).cutVestedDelegatePosition(newValidator.address, this.minDelegation);

      // verify that there are rewards left to claim
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        systemHydraChain,
        hydraDelegation,
        newValidator.address,
        vestManager.address
      );

      expect(
        await hydraDelegation.getDelegatorPositionReward(
          newValidator.address,
          vestManager.address,
          epochNum,
          balanceChangeIndex
        ),
        "getDelegatorPositionReward"
      ).to.not.be.eq(0);

      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("vesting", ERRORS.swap.newPositionUnavailable);
    });

    it("should transfer old position parameters to the new one on successful swap", async function () {
      const { systemHydraChain, hydraDelegation, vestManager, vestManagerOwner, hydraStaking } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const validator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];

      const vestingDuration = 2; // 2 weeks
      await vestManager.connect(vestManagerOwner).openVestedDelegatePosition(validator.address, vestingDuration, {
        value: this.minDelegation.mul(2),
      });

      await commitEpoch(systemHydraChain, hydraStaking, [validator, newValidator], this.epochSize);

      // swap validator
      await vestManager.connect(vestManagerOwner).swapVestedPositionValidator(validator.address, newValidator.address);

      const oldPosition = await hydraDelegation.vestedDelegationPositions(validator.address, vestManager.address);
      const newPosition = await hydraDelegation.vestedDelegationPositions(newValidator.address, vestManager.address);

      // expect new position to be like the old position
      expect(oldPosition.duration, "oldPosition.duration").to.be.eq(newPosition.duration);
      expect(oldPosition.start, "oldPosition.start").to.be.eq(newPosition.start);
      expect(oldPosition.end, "oldPosition.end").to.be.eq(newPosition.end);
      expect(oldPosition.base, "oldPosition.base").to.be.eq(newPosition.base);
      expect(oldPosition.vestBonus, "oldPosition.vestBonus").to.be.eq(newPosition.vestBonus);
      expect(oldPosition.rsiBonus, "oldPosition.rsiBonus").to.be.eq(newPosition.rsiBonus);
    });

    it("should start earning rewards on new position after swap", async function () {
      const { systemHydraChain, hydraDelegation, vestManager, oldValidator, newValidator, hydraStaking } =
        await loadFixture(this.fixtures.swappedPositionFixture);

      await commitEpoch(systemHydraChain, hydraStaking, [oldValidator, newValidator], this.epochSize);

      const rewardsAfterSwap = await hydraDelegation.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsAfterSwap, "rewardsAfterSwap").to.be.gt(0);
    });

    it("should change balances of the positions after swap", async function () {
      const { systemHydraChain, hydraDelegation, vestManager, vestManagerOwner, hydraStaking } = await loadFixture(
        this.fixtures.vestManagerFixture
      );

      const oldValidator = this.signers.validators[0];
      const newValidator = this.signers.validators[1];
      await vestManager
        .connect(vestManagerOwner)
        .openVestedDelegatePosition(oldValidator.address, 5, { value: this.minDelegation });

      await commitEpoch(systemHydraChain, hydraStaking, [oldValidator, newValidator], this.epochSize);

      const oldPositionAmount = await hydraDelegation.delegationOf(oldValidator.address, vestManager.address);

      // swap validator
      await vestManager
        .connect(vestManagerOwner)
        .swapVestedPositionValidator(oldValidator.address, newValidator.address);

      const newPositionAmount = await hydraDelegation.delegationOf(newValidator.address, vestManager.address);
      const oldPositionAmountAfterSwap = await hydraDelegation.delegationOf(oldValidator.address, vestManager.address);

      // expect old position to be empty
      expect(oldPositionAmountAfterSwap, "newPositionAmountAfterSwap").to.be.eq(0);
      expect(newPositionAmount, "newPositionAmount").to.be.eq(oldPositionAmount);
    });

    it("should stop earning rewards on old position after swap", async function () {
      const {
        systemHydraChain,
        hydraDelegation,
        vestManager,
        oldValidator,
        newValidator,
        rewardsBeforeSwap,
        hydraStaking,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      await commitEpoch(systemHydraChain, hydraStaking, [oldValidator, newValidator], this.epochSize);

      const rewardsAfterSwap = await hydraDelegation.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsAfterSwap, "rewardsAfterSwap").to.be.eq(rewardsBeforeSwap).and.to.be.gt(0);
    });

    it("should revert when pass incorrect swap index", async function () {
      const {
        systemHydraChain,
        hydraDelegation,
        vestManager,
        vestManagerOwner,
        oldValidator,
        newValidator,
        hydraStaking,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 4, this.epochSize, WEEK);

      const rewardsBeforeClaim = await hydraDelegation.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsBeforeClaim).to.be.gt(0);

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        systemHydraChain,
        hydraDelegation,
        newValidator.address,
        vestManager.address
      );

      await expect(
        vestManager
          .connect(vestManagerOwner)
          .claimVestedPositionReward(newValidator.address, epochNum, balanceChangeIndex + 1)
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("vesting", ERRORS.vesting.invalidParamsIndex);
    });

    it("should claim all rewards from the new position after swap", async function () {
      const {
        systemHydraChain,
        hydraDelegation,
        vestManager,
        vestManagerOwner,
        oldValidator,
        newValidator,
        hydraStaking,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 4, this.epochSize, WEEK);

      const rewardsBeforeClaim = await hydraDelegation.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsBeforeClaim).to.be.gt(0);

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        systemHydraChain,
        hydraDelegation,
        newValidator.address,
        vestManager.address
      );

      await vestManager
        .connect(vestManagerOwner)
        .claimVestedPositionReward(newValidator.address, epochNum, balanceChangeIndex);

      const rewardsAfterClaim = await hydraDelegation.getRawDelegatorReward(newValidator.address, vestManager.address);
      expect(rewardsAfterClaim).to.be.eq(0);
    });

    it("should claim all rewards from the old position after swap when the reward is matured", async function () {
      const {
        systemHydraChain,
        hydraDelegation,
        vestManager,
        vestManagerOwner,
        oldValidator,
        newValidator,
        hydraStaking,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      // commit epochs and increase time to make the position matured & commit epochs
      await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 3, this.epochSize, WEEK);

      const rewardsBeforeClaim = await hydraDelegation.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsBeforeClaim, "rewardsBeforeClaim").to.be.gt(0);

      // prepare params for call
      const { epochNum, balanceChangeIndex } = await retrieveRPSData(
        systemHydraChain,
        hydraDelegation,
        oldValidator.address,
        vestManager.address
      );

      await vestManager
        .connect(vestManagerOwner)
        .claimVestedPositionReward(oldValidator.address, epochNum, balanceChangeIndex);

      const rewardsAfterClaim = await hydraDelegation.getRawDelegatorReward(oldValidator.address, vestManager.address);
      expect(rewardsAfterClaim, "rewardsAfterClaim").to.be.eq(0);
    });

    it("should revert when try to swap again during the same epoch", async function () {
      const {
        hydraDelegation,
        vestManager,
        vestManagerOwner,
        newValidator: oldValidator,
      } = await loadFixture(this.fixtures.swappedPositionFixture);

      const newValidator = this.signers.validators[2];
      // try to swap
      await expect(
        vestManager.connect(vestManagerOwner).swapVestedPositionValidator(oldValidator.address, newValidator.address)
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("_saveAccountParamsChange", "BALANCE_CHANGE_ALREADY_MADE");
    });
  });
}
