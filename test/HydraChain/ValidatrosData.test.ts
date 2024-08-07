/* eslint-disable node/no-extraneous-import */
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { ERRORS } from "../constants";

export function RunValidatorsDataTests(): void {
  it("should revert syncValidatorsData if not called by system", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);
    await expect(hydraChain.connect(this.signers.governance).syncValidatorsData([]))
      .to.be.revertedWithCustomError(hydraChain, ERRORS.unauthorized.name)
      .withArgs(ERRORS.unauthorized.systemCallArg);
  });

  it("should syncValidatorsData and update validators data", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const validatorsData = [{ validator: this.signers.validators[1].address, votingPower: 12 }];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

    expect(await hydraChain.validatorPower(this.signers.validators[1].address)).to.deep.equal(12);
  });

  it("should correctly update the total voting power", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const validatorsData = [
      { validator: this.signers.validators[1].address, votingPower: 12 },
      { validator: this.signers.validators[2].address, votingPower: 8 },
    ];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

    expect(await hydraChain.totalVotingPower()).to.deep.equal(20);

    const validatorsDataNew = [
      { validator: this.signers.validators[1].address, votingPower: 2 },
      { validator: this.signers.validators[2].address, votingPower: 3 },
    ];

    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsDataNew);

    expect(await hydraChain.totalVotingPower()).to.deep.equal(5);
  });
}
