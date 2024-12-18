/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

// eslint-disable-next-line camelcase
import { DAY, ERRORS, WEEK } from "../constants";
import { setAndApplyCommission } from "../helper";

export function RunDelegationTests(): void {
  describe("Total Delegation", function () {
    it("should add up to delegation variables & balance after delegation", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      const totalDelegation = await hydraDelegation.totalDelegation();
      const delegationOfDelegator = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const delegatedToStaker = await hydraDelegation.totalDelegationOf(this.signers.validators[0].address);
      expect(totalDelegation).to.equal(this.minDelegation.mul(2));
      expect(delegatedToStaker).to.equal(this.minDelegation.mul(2));
      expect(delegationOfDelegator).to.equal(this.minDelegation.mul(2));
      expect(await hre.ethers.provider.getBalance(hydraDelegation.address)).to.equal(totalDelegation);
    });

    it("should reduce delegation variables after undelegation, but balance in contract stays the same", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      const delegatedAmountBefore = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const totalDelegationBefore = await hydraDelegation.totalDelegation();

      await hydraDelegation
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[0].address, delegatedAmountBefore);

      const totalDelegationAfter = await hydraDelegation.totalDelegation();
      expect(totalDelegationAfter).to.equal(totalDelegationBefore.sub(delegatedAmountBefore));
      expect(await hydraDelegation.totalDelegationOf(this.signers.validators[0].address)).to.equal(0);
      expect(
        await hydraDelegation.delegationOf(this.signers.validators[0].address, this.signers.delegator.address)
      ).to.equal(0);
      expect(await hre.ethers.provider.getBalance(hydraDelegation.address)).to.equal(totalDelegationBefore);
    });

    it("balance in contract should reduce after withdraw, and it is = to total delegation", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      const delegatedAmount = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      await hydraDelegation
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[0].address, delegatedAmount);

      const totalDelegation = await hydraDelegation.totalDelegation();

      // increase time to allow withdrawal
      await hre.network.provider.send("evm_increaseTime", [WEEK]);
      await hre.network.provider.send("evm_mine");

      await hydraDelegation.connect(this.signers.delegator).withdraw(this.signers.delegator.address);
      expect(await hre.ethers.provider.getBalance(hydraDelegation.address)).to.equal(totalDelegation);
    });
  });

  describe("Delegate", function () {
    it("should revert when delegating zero amount", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(hydraDelegation.delegate(this.signers.validators[0].address, { value: 0 }))
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("delegate", "DELEGATING_AMOUNT_ZERO");
    });

    it("should not be able to delegate less than minDelegation", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(
        hydraDelegation.delegate(this.signers.validators[0].address, {
          value: this.minDelegation.div(2),
        })
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("delegate", "DELEGATION_TOO_LOW");
    });

    it("should revert if we try to delegate to inactive validator", async function () {
      const { hydraDelegation, hydraStaking } = await loadFixture(this.fixtures.withdrawableFixture);

      await expect(
        hydraDelegation.delegate(this.signers.validators[3].address, {
          value: this.minDelegation.mul(2),
        })
      )
        .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.inactiveStakerArg);
    });

    it("should delegate for the first time", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.withdrawableFixture);
      const delegateAmount = this.minDelegation.mul(2);

      const tx = await hydraDelegation.connect(this.signers.delegator).delegate(this.signers.validators[0].address, {
        value: delegateAmount,
      });

      await expect(tx)
        .to.emit(hydraDelegation, "Delegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegateAmount);

      const delegatedAmount = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      expect(delegatedAmount).to.equal(delegateAmount);
    });

    it("should delegate again and register a withdrawal for the claimed rewards automatically", async function () {
      const { hydraDelegation, rewardWallet } = await loadFixture(this.fixtures.delegatedFixture);

      const delegateAmount = this.minDelegation.div(2);
      const delegatorReward = await hydraDelegation.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      const tx = await hydraDelegation.connect(this.signers.delegator).delegate(this.signers.validators[0].address, {
        value: delegateAmount,
      });

      await expect(tx, "DelegatorRewardsClaimed")
        .to.emit(hydraDelegation, "DelegatorRewardsClaimed")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegatorReward);

      await expect(tx, "RewardDistributed")
        .to.emit(rewardWallet, "RewardDistributed")
        .withArgs(this.signers.delegator.address, delegatorReward);

      await expect(tx, "Delegated")
        .to.emit(hydraDelegation, "Delegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegateAmount);
    });
  });

  describe("Undelegate", async function () {
    it("should not be able to undelegate more than the delegated amount", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);
      const delegatedAmount = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      await expect(
        hydraDelegation
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, delegatedAmount.add(1))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("should not be able to undelegate such amount, so the left delegation is lower than minDelegation", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);
      const delegatedAmount = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      await expect(
        hydraDelegation
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, delegatedAmount.sub(1))
      )
        .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
        .withArgs("undelegate", "DELEGATION_TOO_LOW");
    });

    it("should not be able to exploit int overflow", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      await expect(
        hydraDelegation
          .connect(this.signers.delegator)
          .undelegate(this.signers.validators[0].address, hre.ethers.constants.MaxInt256.add(1))
      ).to.be.reverted;
    });

    it("should partially undelegate", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      const delegatedAmount = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const expectedReward = await hydraDelegation.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const undelegateAmount = this.minDelegation.div(2);
      const tx = await hydraDelegation
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[0].address, undelegateAmount);

      await expect(tx, "WithdrawalRegistered")
        .to.emit(hydraDelegation, "WithdrawalRegistered")
        .withArgs(this.signers.delegator.address, undelegateAmount);

      await expect(tx, "DelegatorRewardsClaimed")
        .to.emit(hydraDelegation, "DelegatorRewardsClaimed")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, expectedReward);

      await expect(tx, "Undelegated")
        .to.emit(hydraDelegation, "Undelegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, undelegateAmount);

      const delegatedAmountLeft = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      expect(delegatedAmountLeft, "delegatedAmountLeft").to.equal(delegatedAmount.sub(undelegateAmount));
    });

    it("should completely undelegate", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      const delegatedAmount = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const expectedReward = await hydraDelegation.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      const tx = await hydraDelegation
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[0].address, delegatedAmount);

      await expect(tx, "WithdrawalRegistered")
        .to.emit(hydraDelegation, "WithdrawalRegistered")
        .withArgs(this.signers.delegator.address, delegatedAmount);

      await expect(tx, "DelegatorRewardsClaimed")
        .to.emit(hydraDelegation, "DelegatorRewardsClaimed")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, expectedReward);

      await expect(tx, "Undelegated")
        .to.emit(hydraDelegation, "Undelegated")
        .withArgs(this.signers.validators[0].address, this.signers.delegator.address, delegatedAmount);

      const delegatedAmountLeft = await hydraDelegation.delegationOf(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      expect(delegatedAmountLeft, "delegatedAmountLeft").to.equal(0);
    });
  });

  describe("Get Delegator Reward", function () {
    it("should change getDelegatorReward according to the commission", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      const delegatorReward = await hydraDelegation.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      expect(delegatorReward).to.gt(0);
      expect(await hydraDelegation.delegationCommissionPerStaker(this.signers.validators[0].address)).to.eq(0);
      await setAndApplyCommission(hydraDelegation, this.signers.validators[0], 10);

      const delegatorRewardAfter10Cut = await hydraDelegation.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      expect(delegatorRewardAfter10Cut).to.eq(delegatorReward.sub(delegatorReward.div(10)));

      await setAndApplyCommission(hydraDelegation, this.signers.validators[0], 100);
      const delegatorRewardAfterFullCut = await hydraDelegation.getDelegatorReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );
      expect(delegatorRewardAfterFullCut).to.eq(0);
    });

    it("should not change effect getRawReward on commission change", async function () {
      const { hydraDelegation } = await loadFixture(this.fixtures.delegatedFixture);

      await hydraDelegation.connect(this.signers.validators[0]).setPendingCommission(100);
      time.increase(DAY * 15);

      const delegatorReward = await hydraDelegation.getRawReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      expect(delegatorReward).to.gt(0);
      expect(await hydraDelegation.delegationCommissionPerStaker(this.signers.validators[0].address)).to.eq(0);
      await hydraDelegation.connect(this.signers.validators[0]).applyPendingCommission();
      const delegatorRewardAfterCommissionUpdate = await hydraDelegation.getRawReward(
        this.signers.validators[0].address,
        this.signers.delegator.address
      );

      expect(delegatorRewardAfterCommissionUpdate).to.eq(delegatorReward);
    });
  });
}
