/* eslint-disable node/no-extraneous-import */
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ERRORS } from "../constants";

export function RunDelegatedStakingTests(): void {
  describe("", function () {
    it("should revert if we try to call OnDelegate from non-HydraDelegate contract", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraStaking.onDelegate(this.signers.accounts[1].address))
        .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.onlyHydraDelegationArg);
    });

    it("should revert if we try to call OnDelegate with non-active Validator from Delegate contract", async function () {
      const { hydraDelegation, hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraDelegation.delegate(this.signers.accounts[5].address, { value: this.minDelegation }))
        .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.inactiveStakerArg);
    });

    it("should revert if we try to call OnUnDelegate from non-HydraDelegate contract", async function () {
      const { hydraStaking } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await expect(hydraStaking.onUndelegate(this.signers.accounts[3].address))
        .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.onlyHydraDelegationArg);
    });

    it("should emit BalanceChanged event when delegating", async function () {
      const { hydraDelegation, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const validatorBalanceBefore = await hydraStaking.totalBalanceOf(this.signers.validators[0].address);
      const tx = await hydraDelegation.delegate(this.signers.validators[0].address, { value: this.minDelegation });

      await expect(tx)
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(this.signers.validators[0].address, this.minDelegation.add(validatorBalanceBefore));
    });

    it("should emit BalanceChanged event on undelegate", async function () {
      const { hydraDelegation, hydraStaking } = await loadFixture(this.fixtures.delegatedFixture);

      const validatorBalanceBefore = await hydraStaking.totalBalanceOf(this.signers.validators[0].address);
      const tx = await hydraDelegation
        .connect(this.signers.delegator)
        .undelegate(this.signers.validators[0].address, this.minDelegation);

      await expect(tx)
        .to.emit(hydraStaking, "BalanceChanged")
        .withArgs(this.signers.validators[0].address, validatorBalanceBefore.sub(this.minDelegation));
    });
  });
}
