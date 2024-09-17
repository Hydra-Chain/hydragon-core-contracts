/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

import { ERRORS } from "../constants";

export function RunDaoIncentiveTests(): void {
  describe("distributeDAOIncentive", function () {
    it("should revert if not called by system", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).distributeDAOIncentive(), "setIncentive")
        .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.systemCallArg);
    });

    it("should distribute funds to the vault", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.commitEpochTxFixture);

      const lastDistribution = await hydraChain.lastDistribution();
      const distributeVaultFundsTx = await hydraChain.connect(this.signers.system).distributeDAOIncentive();
      const latestTimestamp = await time.latest();
      const totalSupply = await hydraStaking.totalBalance();
      const reward = totalSupply
        .mul(200)
        .div(10000)
        .mul(ethers.BigNumber.from(latestTimestamp).sub(lastDistribution))
        .div(time.duration.days(365));

      await expect(distributeVaultFundsTx).to.emit(hydraChain, "VaultFundsDistributed").withArgs(reward);
      expect(await hydraChain.vaultDistribution()).to.be.equal(reward);
      expect(await hydraChain.lastDistribution()).to.be.equal(latestTimestamp);
    });

    it("should have reward for 2 stakers with min stake", async function () {
      const { hydraChain, hydraStaking } = await loadFixture(this.fixtures.distributeVaultFundsFixture);

      const totalSupply = await hydraStaking.totalBalance();

      expect(totalSupply).to.be.eq(this.minStake.mul(2));
      expect(await hydraChain.vaultDistribution()).to.be.above(0);
    });
  });

  describe("claimVaultFunds", function () {
    it("should revert when there are not vault funds to claim", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      await expect(hydraChain.claimVaultFunds()).to.be.revertedWith("NO_VAULT_FUNDS_TO_CLAIM");
    });

    it("should claim vault funds", async function () {
      const { hydraChain, hydraStaking, DAOIncentiveVault } = await loadFixture(this.fixtures.commitEpochTxFixture);

      const totalSupply = await hydraStaking.totalBalance();
      const lastDistribution = await hydraChain.lastDistribution();
      await hydraChain.connect(this.signers.system).distributeDAOIncentive();
      const latestTimestamp = await time.latest();
      const reward = totalSupply
        .mul(200)
        .div(10000)
        .mul(ethers.BigNumber.from(latestTimestamp).sub(lastDistribution))
        .div(time.duration.days(365));
      const claimVaultFundsTx = await hydraChain.claimVaultFunds();

      await expect(claimVaultFundsTx).to.emit(hydraChain, "VaultFunded").withArgs(reward);
      expect(await ethers.provider.getBalance(DAOIncentiveVault.address)).to.be.equal(reward);
      await expect(claimVaultFundsTx).to.changeEtherBalance(DAOIncentiveVault, reward);
      expect(await hydraChain.vaultDistribution()).to.be.equal(0);
    });
  });
}
