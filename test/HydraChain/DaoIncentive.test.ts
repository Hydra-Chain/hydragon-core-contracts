/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

import { EPOCHS_YEAR, ERRORS } from "../constants";

export function RunDaoIncentiveTests(): void {
  describe("distributeVaultFunds", function () {
    it("should revert if not called by system", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).distributeVaultFunds(), "setIncentive")
        .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.systemCallArg);
    });

    it("should revert if if we try to distribute in the same epoch", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.distributeVaultFundsFixture);

      await expect(hydraChain.connect(this.signers.system).distributeVaultFunds()).to.be.revertedWith(
        "VAULT_FUNDS_ALREADY_DISTRIBUTED"
      );
    });

    it("should distribute funds to the vault", async function () {
      const { hydraChain, distributeVaultFundsTx, hydraStaking } = await loadFixture(
        this.fixtures.distributeVaultFundsFixture
      );

      const currEpochId = await hydraChain.currentEpochId();
      const totalSupply = await hydraStaking.totalBalance();
      const reward = totalSupply.mul(200).div(10000).div(EPOCHS_YEAR);

      await expect(distributeVaultFundsTx).to.emit(hydraChain, "VaultFundsDistributed").withArgs(currEpochId, reward);
      expect(await hydraChain.vaultDistributionPerEpoch(currEpochId)).to.be.equal(reward);
      expect(await hydraChain.vaultDistribution()).to.be.equal(reward);
    });
  });

  describe("claimVaultFunds", function () {
    it("should revert when there are not vault funds to claim", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.commitEpochTxFixture);

      await expect(hydraChain.claimVaultFunds()).to.be.revertedWith("NO_VAULT_FUNDS_TO_CLAIM");
    });

    it("should claim vault funds", async function () {
      const { hydraChain, hydraStaking, hydraVault } = await loadFixture(this.fixtures.distributeVaultFundsFixture);

      const currEpochId = await hydraChain.currentEpochId();
      const totalSupply = await hydraStaking.totalBalance();
      const reward = totalSupply.mul(200).div(10000).div(EPOCHS_YEAR);
      const claimVaultFundsTx = await hydraChain.claimVaultFunds();

      await expect(claimVaultFundsTx).to.emit(hydraChain, "VaultFunded").withArgs(currEpochId, reward);
      expect(await ethers.provider.getBalance(hydraVault.address)).to.be.equal(reward);
      await expect(claimVaultFundsTx).to.changeEtherBalance(hydraVault, reward);
      expect(await hydraChain.vaultDistribution()).to.be.equal(0);
    });
  });
}
