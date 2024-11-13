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

  it("should correctly update validators data on increase and decrease of voting power", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const validatorsData = [
      { validator: this.signers.validators[1].address, votingPower: 12 },
      { validator: this.signers.validators[2].address, votingPower: 8 },
    ];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

    expect(await hydraChain.validatorPower(this.signers.validators[1].address)).to.deep.equal(12);
    expect(await hydraChain.validatorPower(this.signers.validators[2].address)).to.deep.equal(8);

    const validatorsDataDecrease = [
      { validator: this.signers.validators[1].address, votingPower: 2 },
      { validator: this.signers.validators[2].address, votingPower: 3 },
    ];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsDataDecrease);

    expect(await hydraChain.validatorPower(this.signers.validators[1].address)).to.deep.equal(2);
    expect(await hydraChain.validatorPower(this.signers.validators[2].address)).to.deep.equal(3);

    const validatorsDataIncrease = [
      { validator: this.signers.validators[1].address, votingPower: 22 },
      { validator: this.signers.validators[2].address, votingPower: 34 },
    ];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsDataIncrease);

    expect(await hydraChain.validatorPower(this.signers.validators[1].address)).to.deep.equal(22);
    expect(await hydraChain.validatorPower(this.signers.validators[2].address)).to.deep.equal(34);
    expect(await hydraChain.validatorPower(this.signers.validators[3].address)).to.deep.equal(0);

    const validatorsDataMix = [
      { validator: this.signers.validators[1].address, votingPower: 42 },
      { validator: this.signers.validators[2].address, votingPower: 5 },
      { validator: this.signers.validators[3].address, votingPower: 14 },
    ];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsDataMix);

    expect(await hydraChain.validatorPower(this.signers.validators[1].address)).to.deep.equal(42);
    expect(await hydraChain.validatorPower(this.signers.validators[2].address)).to.deep.equal(5);
    expect(await hydraChain.validatorPower(this.signers.validators[3].address)).to.deep.equal(14);

    const validatorsDataSameValue = [
      { validator: this.signers.validators[1].address, votingPower: 42 },
      { validator: this.signers.validators[2].address, votingPower: 5 },
      { validator: this.signers.validators[3].address, votingPower: 14 },
    ];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsDataSameValue);

    expect(await hydraChain.validatorPower(this.signers.validators[1].address)).to.deep.equal(42);
    expect(await hydraChain.validatorPower(this.signers.validators[2].address)).to.deep.equal(5);
    expect(await hydraChain.validatorPower(this.signers.validators[3].address)).to.deep.equal(14);
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
      { validator: this.signers.validators[3].address, votingPower: 1 },
    ];

    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsDataNew);

    expect(await hydraChain.totalVotingPower()).to.deep.equal(6);

    const validatorsDataSameTotal = [
      { validator: this.signers.validators[1].address, votingPower: 2 },
      { validator: this.signers.validators[2].address, votingPower: 2 },
      { validator: this.signers.validators[3].address, votingPower: 2 },
    ];

    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsDataSameTotal);

    expect(await hydraChain.totalVotingPower()).to.deep.equal(6);
  });

  it("should get the validator power", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const validatorsData = [{ validator: this.signers.validators[1].address, votingPower: 15 }];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

    expect(await hydraChain.getValidatorPower(this.signers.validators[1].address)).to.deep.equal(15);
  });

  it("should get the validator power", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const validatorsData = [{ validator: this.signers.validators[1].address, votingPower: 15 }];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

    expect(await hydraChain.getValidatorPower(this.signers.validators[1].address)).to.deep.equal(15);
  });

  it("should get the total voting power", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const validatorsData = [
      { validator: this.signers.validators[1].address, votingPower: 12 },
      { validator: this.signers.validators[2].address, votingPower: 8 },
    ];
    await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

    expect(await hydraChain.getTotalVotingPower()).to.deep.equal(20);
  });

  it("should emit event on syncValidatorsData", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    const validatorsData = [{ validator: this.signers.validators[1].address, votingPower: 12 }];
    await expect(hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData)).to.emit(
      hydraChain,
      "ValidatorsDataSynced"
    );
  });

  it("should return if we pass empty validators data", async function () {
    const { hydraChain } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

    await expect(hydraChain.connect(this.signers.system).syncValidatorsData([])).to.not.emit(
      hydraChain,
      "ValidatorsDataSynced"
    );
  });
}
