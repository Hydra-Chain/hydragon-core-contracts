/* eslint-disable node/no-extraneous-import */
import { loadFixture, time, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { DENOMINATOR, ERRORS, VALIDATOR_STATUS, VESTING_DURATION_WEEKS, WEEK } from "../constants";
import { ethers } from "hardhat";
import { commitEpochs } from "../helper";

export function RunInspectorTests(): void {
  describe("setValidatorPenalty", function () {
    it("should revert not owner when try to set validator penalty", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).setValidatorPenalty(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new validator penalty", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newValidatorPenalty = 10;
      await hydraChain.connect(this.signers.governance).setValidatorPenalty(newValidatorPenalty);
      expect(await hydraChain.validatorPenalty()).to.be.equal(newValidatorPenalty);
    });
  });

  describe("setReporterReward", function () {
    it("should revert not owner when try to set reporter reward", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).setReporterReward(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new reporter reward", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newReporterReward = 5;
      await hydraChain.connect(this.signers.governance).setReporterReward(newReporterReward);
      expect(await hydraChain.reporterReward()).to.be.equal(newReporterReward);
    });
  });

  describe("setBanThreshold", function () {
    it("should revert not owner when try to set ban threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(hydraChain.connect(this.signers.validators[0]).setBanThreshold(0)).to.be.revertedWith(
        ERRORS.ownable
      );
    });

    it("should set new ban threshold", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const newBanThreshold = 100;
      await hydraChain.connect(this.signers.governance).setBanThreshold(newBanThreshold);
      expect(await hydraChain.banThreshold()).to.be.equal(newBanThreshold);
    });
  });

  describe("Ban a validator", function () {
    it("should revert when the validator NoBanSubject (not register, nor active)", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

      await expect(hydraChain.banValidator(this.signers.validators[0].address)).to.be.revertedWithCustomError(
        hydraChain,
        "NoBanSubject"
      );
    });

    it("should revert when the validator is active from less than the threshold", async function () {
      const { hydraChain, systemHydraChain, hydraStaking } = await loadFixture(
        this.fixtures.stakedValidatorsStateFixture
      );

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(hydraChain.banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(hydraChain, "NoBanSubject")
        .withArgs();
    });

    it("should revert when the validator is active for long time and have not met the threshold", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(systemHydraChain.banValidator(this.signers.validators[0].address))
        .to.be.revertedWithCustomError(systemHydraChain, "NoBanSubject")
        .withArgs();
    });

    // it("should ban a validator that has a vested staking position", async function () {
    //   const { stakerHydraStake, hydraStaking } = await loadFixture(this.fixtures.newVestingValidatorFixture);
    //   await stakerHydraStake.connect(this.signers.governance).setValidatorPenalty(this.minStake.div(10));

    //   const staker = this.signers.accounts[9];
    //   const vestingData = await hydraStaking.positions(staker.address);
    //   const nextTimestamp = vestingData.start.add(WEEK);
    //   await time.setNextBlockTimestamp(nextTimestamp);

    //   const validatorBanPenalty = await stakerHydraStake.validatorPenalty();
    //   // hardcode the penalty percent by 0.3% a week
    //   const bps = (VESTING_DURATION_WEEKS - 1) * 30;
    //   const unstakePenalty = this.minStake.mul(bps).div(DENOMINATOR);
    //   const stakedAmount = await stakerHydraStake.balanceOf(staker.address);
    //   const stakedAmountAfterPenalty = stakedAmount.sub(unstakePenalty).sub(validatorBanPenalty);

    //   const banTx = await stakerHydraStake.connect(this.signers.governance).banValidator(staker.address);
    //   const withdrawalBalance = await stakerHydraStake.withdrawalBalances(staker.address);

    //   await expect(banTx, "ValidatorBanned").to.emit(stakerHydraStake, "ValidatorBanned").withArgs(staker.address);
    //   expect(withdrawalBalance.liquidTokens, "withdrawable").to.be.equal(stakedAmount);
    //   expect(withdrawalBalance.withdrawableAmount, "withdrawable").to.be.equal(stakedAmountAfterPenalty);
    // });

    // it("should ban the validator, even if he succeeded to unstake before that", async function () {
    //   const { hydraChain, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

    //   const stakedAmount = await hydraChain.balanceOf(validatorToBan.address);
    //   await hydraChain.connect(validatorToBan).unstake(stakedAmount);

    //   const banTx = await hydraChain.banValidator(validatorToBan.address);

    //   expect((await hydraChain.validators(validatorToBan.address)).status, "status").to.be.equal(
    //     VALIDATOR_STATUS.Banned
    //   );
    //   expect((await hydraChain.getValidator(validatorToBan.address)).active, "active").to.be.equal(false);
    //   expect(await hydraChain.balanceOf(validatorToBan.address), "balanceOf").to.be.equal(0);
    //   await expect(banTx, "ValidatorBanned").to.emit(hydraChain, "ValidatorBanned").withArgs(validatorToBan.address);
    // });

    // it("should ban and penalize the validator", async function () {
    //   const { hydraChain, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

    //   const stakedAmount = await hydraChain.balanceOf(validatorToBan.address);

    //   const banTx = await hydraChain.banValidator(validatorToBan.address);

    //   const reporterReward = await hydraChain.reporterReward();
    //   const validatorBanPenalty = await hydraChain.validatorPenalty();
    //   const balanceToWithdrawFromContract = reporterReward.add(validatorBanPenalty);
    //   const withdrawalBalance = await hydraChain.withdrawalBalances(validatorToBan.address);

    //   expect(await hydraChain.balanceOf(validatorToBan.address), "balanceOf").to.be.equal(0);
    //   expect(withdrawalBalance.liquidTokens, "liquidTokens").to.be.equal(stakedAmount);
    //   expect(withdrawalBalance.withdrawableAmount, "withdrawableAmount").to.be.equal(
    //     stakedAmount.sub(reporterReward).sub(validatorBanPenalty)
    //   );
    //   await expect(banTx, "StakeChanged").to.emit(hydraChain, "StakeChanged").withArgs(validatorToBan.address, 0);
    //   await expect(banTx, "withdrawn reward").to.changeEtherBalances(
    //     [hydraChain.address, await hydraChain.signer.getAddress(), ethers.constants.AddressZero],
    //     [balanceToWithdrawFromContract.mul(-1), reporterReward, validatorBanPenalty]
    //   );
    // });

    // it("should get only reporter reward, because it is more than the stake", async function () {
    //   const { hydraChain, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

    //   const stakedAmount = await hydraChain.balanceOf(validatorToBan.address);

    //   await hydraChain.connect(this.signers.governance).setReporterReward(stakedAmount.mul(2));

    //   const banTx = await hydraChain.banValidator(validatorToBan.address);

    //   const withdrawalBalance = await hydraChain.withdrawalBalances(validatorToBan.address);

    //   expect(withdrawalBalance.withdrawableAmount, "withdrawableAmount").to.be.equal(0);
    //   await expect(banTx, "withdrawn reward").to.changeEtherBalances(
    //     [hydraChain.address, await hydraChain.signer.getAddress(), ethers.constants.AddressZero],
    //     [stakedAmount.mul(-1), stakedAmount, 0]
    //   );
    // });

    // it("should get reporter reward, but to penalyze the whole stake when penalty is more than the stake", async function () {
    //   const { hydraChain, validatorToBan } = await loadFixture(this.fixtures.validatorToBanFixture);

    //   const stakedAmount = await hydraChain.balanceOf(validatorToBan.address);

    //   await hydraChain.connect(this.signers.governance).setValidatorPenalty(stakedAmount.mul(2));

    //   const banTx = await hydraChain.banValidator(validatorToBan.address);

    //   const reporterReward = await hydraChain.reporterReward();
    //   const withdrawalBalance = await hydraChain.withdrawalBalances(validatorToBan.address);

    //   expect(withdrawalBalance.withdrawableAmount, "withdrawableAmount").to.be.equal(0);
    //   await expect(banTx, "withdrawn reward").to.changeEtherBalances(
    //     [hydraChain.address, await hydraChain.signer.getAddress(), ethers.constants.AddressZero],
    //     [stakedAmount.mul(-1), reporterReward, stakedAmount.sub(reporterReward)]
    //   );
    // });

    it("should ban the validator even if threhshold is not met, if called from the contract owner", async function () {
      const { systemHydraChain, hydraStaking } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      // commit a couple of epochs in order to have a timestamp
      await commitEpochs(
        systemHydraChain,
        hydraStaking,
        [this.signers.validators[0], this.signers.validators[1]],
        5, // number of epochs to commit
        this.epochSize
      );

      await expect(systemHydraChain.connect(this.signers.governance).banValidator(this.signers.validators[0].address))
        .to.not.be.reverted;
    });
  });

  // describe("Withdraw banned funds", function () {
  //   it("should revert when trying to withdraw from non banned validator", async function () {
  //     const { hydraChain } = await loadFixture(this.fixtures.bannedValidatorFixture);

  //     await expect(hydraChain.connect(this.signers.validators[2]).withdrawBannedFunds())
  //       .to.be.revertedWithCustomError(hydraChain, "Unauthorized")
  //       .withArgs("UNBANNED_VALIDATOR");
  //   });

  //   it("should fail the withdrawal when there are no funds in the validator set", async function () {
  //     const { hydraChain, bannedValidator } = await loadFixture(this.fixtures.bannedValidatorFixture);

  //     // clear the contract's balance in order to force withdrawal fail
  //     setBalance(hydraChain.address, 0);
  //     await expect(hydraChain.connect(bannedValidator).withdrawBannedFunds()).to.be.revertedWith("WITHDRAWAL_FAILED");
  //   });

  //   it("should successfully withdraw the funds", async function () {
  //     const { hydraChain, liquidToken, bannedValidator, stakedAmount } = await loadFixture(
  //       this.fixtures.bannedValidatorFixture
  //     );

  //     const validatorBanPenalty = await hydraChain.validatorPenalty();
  //     const withdrawAmount = stakedAmount.sub(validatorBanPenalty);
  //     const withdrawTx = await hydraChain.connect(bannedValidator).withdrawBannedFunds();

  //     await expect(withdrawTx, "emit Transfer")
  //       .to.emit(liquidToken, "Transfer")
  //       .withArgs(bannedValidator.address, ethers.constants.AddressZero, stakedAmount);
  //     expect(await liquidToken.balanceOf(bannedValidator.address), "lydra balanceOf").to.be.equal(0);
  //     await expect(withdrawTx, "emit WithdrawalFinished")
  //       .to.emit(hydraChain, "WithdrawalFinished")
  //       .withArgs(hydraChain.address, bannedValidator.address, withdrawAmount);
  //     await expect(withdrawTx, "change balances").to.changeEtherBalances(
  //       [hydraChain.address, bannedValidator.address],
  //       [withdrawAmount.mul(-1), withdrawAmount]
  //     );

  //     const withdrawalBalance = await hydraChain.withdrawalBalances(bannedValidator.address);
  //     expect(withdrawalBalance.liquidTokens, "withdrawalBalance.liquidTokens").to.be.equal(0);
  //     expect(withdrawalBalance.withdrawableAmount, "withdrawalBalance.withdrawableAmount").to.be.equal(0);
  //   });
  // });
}
