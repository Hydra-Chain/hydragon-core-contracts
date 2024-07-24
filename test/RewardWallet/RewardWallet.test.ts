import { ethers } from "hardhat";
/* eslint-disable node/no-extraneous-import */
import { loadFixture, setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { ERRORS } from "../constants";
import { commitEpochs } from "../helper";

export function RunRewardWalletTests(): void {
  describe("Initialization", function () {
    it("should validate default values when RewardWallet is deployed - no balance and managers", async function () {
      const { rewardWallet, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.presetHydraChainStateFixture
      );

      expect(await rewardWallet.rewardManagers(hydraStaking.address)).to.equal(false);
      expect(await rewardWallet.rewardManagers(hydraDelegation.address)).to.equal(false);
      expect(await ethers.provider.getBalance(rewardWallet.address)).to.equal(0);
    });

    it("should revert when initialize without system call", async function () {
      const { rewardWallet, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.presetHydraChainStateFixture
      );

      await expect(rewardWallet.initialize([hydraStaking.address, hydraDelegation.address]))
        .to.be.revertedWithCustomError(rewardWallet, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.systemCallArg);
    });

    it("should initialize successfully", async function () {
      const { rewardWallet, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.presetHydraChainStateFixture
      );

      await rewardWallet.connect(this.signers.system).initialize([hydraStaking.address, hydraDelegation.address]);

      expect(await rewardWallet.rewardManagers(hydraStaking.address), "hydraStaking").to.equal(true);
      expect(await rewardWallet.rewardManagers(hydraDelegation.address), "hydraDelegation").to.equal(true);
    });

    it("should revert on re-initialization attempt", async function () {
      const { rewardWallet, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      await expect(
        rewardWallet.connect(this.signers.system).initialize([hydraStaking.address, hydraDelegation.address])
      ).to.be.revertedWith(ERRORS.initialized);
    });

    it("should send some HYDRA to the reward wallet successfully", async function () {
      const { rewardWallet, hydraStaking, hydraDelegation } = await loadFixture(
        this.fixtures.presetHydraChainStateFixture
      );

      await rewardWallet.connect(this.signers.system).initialize([hydraStaking.address, hydraDelegation.address]);

      const sendAmount = this.minStake.mul(5);

      const tx = await this.signers.rewardWallet.sendTransaction({
        from: this.signers.rewardWallet.address,
        to: rewardWallet.address,
        value: sendAmount,
      });

      expect(await ethers.provider.getBalance(rewardWallet.address), "getBalance").to.be.eq(sendAmount);
      await expect(tx, "Received emitted")
        .to.emit(rewardWallet, "Received")
        .withArgs(this.signers.rewardWallet.address, sendAmount);
    });

    it("should successfully send some HYDRA using the fund function", async function () {
      const { rewardWallet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const sendAmount = this.minStake.mul(5);
      const sender = await rewardWallet.signer.getAddress();

      const fundTx = await rewardWallet.fund({
        value: sendAmount,
      });

      await expect(fundTx, "fundTx balance changes").to.changeEtherBalances(
        [sender, rewardWallet.address],
        [sendAmount.mul(-1), sendAmount]
      );
      expect(await ethers.provider.getBalance(rewardWallet.address), "getBalance").to.not.be.eq(0);
      await expect(fundTx, "Received emitted").to.emit(rewardWallet, "Received").withArgs(sender, sendAmount);
    });
  });

  describe("Distribute reward", function () {
    it("should revert when distributing with non-manager", async function () {
      const { rewardWallet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(rewardWallet.distributeReward(this.signers.validators[0].address, this.minStake))
        .to.be.revertedWithCustomError(rewardWallet, ERRORS.unauthorized.name)
        .withArgs("ONLY_MANAGER");
    });

    it("should revert when distribution is failing", async function () {
      const { systemHydraChain, hydraStaking, rewardWallet } = await loadFixture(
        this.fixtures.stakedValidatorsStateFixture
      );

      const rewardingValidator = this.signers.validators[0];

      // commit some epochs in order to distribute rewards
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [rewardingValidator, this.signers.validators[1]],
        3,
        this.epochSize
      );

      await setBalance(rewardWallet.address, 0);
      const balance = await ethers.provider.getBalance(rewardWallet.address);
      expect(balance, "rewardWallet balance").to.equal(0);

      await expect(
        hydraStaking.connect(rewardingValidator)["claimStakingRewards()"](),
        "DistributionFailed"
      ).to.be.revertedWithCustomError(rewardWallet, "DistributionFailed");
    });

    it("should successfully distribute reward", async function () {
      const { systemHydraChain, hydraStaking, rewardWallet } = await loadFixture(
        this.fixtures.stakedValidatorsStateFixture
      );

      const rewardingValidator = this.signers.validators[0];

      // commit some epochs in order to distribute rewards
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [rewardingValidator, this.signers.validators[1]],
        10,
        this.epochSize
      );

      const unclaimedRewards = await hydraStaking.unclaimedRewards(rewardingValidator.address);
      const claimRewardsTx = await hydraStaking.connect(rewardingValidator)["claimStakingRewards()"]();

      expect(unclaimedRewards, "unclaimedRewards").to.not.be.eq(0);
      await expect(claimRewardsTx, "RewardDistributed emitted")
        .to.emit(rewardWallet, "RewardDistributed")
        .withArgs(rewardingValidator.address, unclaimedRewards);
      await expect(claimRewardsTx, "claimStakingRewards").to.changeEtherBalances(
        [rewardingValidator.address, rewardWallet.address],
        [unclaimedRewards, unclaimedRewards.mul(-1)]
      );
    });
  });
}
