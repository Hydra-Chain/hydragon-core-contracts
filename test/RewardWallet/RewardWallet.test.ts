import { ethers } from "hardhat";
/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
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
  });

  describe("Distribute reward", function () {
    it("should revert when distributing with non-manager", async function () {
      const { rewardWallet } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(rewardWallet.distributeReward(this.signers.validators[0].address, this.minStake))
        .to.be.revertedWithCustomError(rewardWallet, ERRORS.unauthorized.name)
        .withArgs("ONLY_MANAGER");
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
