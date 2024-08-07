/* eslint-disable node/no-extraneous-import */
import { loadFixture, impersonateAccount, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import * as hre from "hardhat";

// eslint-disable-next-line camelcase
import { LiquidityToken__factory, VestingManager__factory } from "../../typechain-types";
import { ERRORS, VESTING_DURATION_WEEKS, WEEK, DEADLINE, DAY } from "../constants";
import {
  calculatePenalty,
  claimPositionRewards,
  commitEpochs,
  getUserManager,
  getPermitSignature,
  retrieveRPSData,
  commitEpoch,
  createManagerAndVest,
  getDelegatorPositionReward,
  calculateTotalPotentialPositionReward,
  calculatePenaltyByWeeks,
  calcLiquidTokensToDistributeOnVesting,
} from "../helper";

export function RunVestedDelegationTests(): void {
  describe("", async function () {
    before(async function () {
      // validator[2] delegates minDelegation and validator[1] delegates minDelegation.mul(2)
      // put them into the context in order to use it in the reward pool tests
      this.delegatedValidators = [this.signers.validators[2].address, this.signers.validators[1].address];
      this.vestManagerOwners = [this.signers.accounts[4], this.signers.accounts[5]];
    });

    it("should have created a base implementation", async function () {
      const { vestingManagerFactory } = await loadFixture(this.fixtures.vestManagerFixture);

      const baseImplementation = await vestingManagerFactory.beacon();
      expect(baseImplementation).to.not.equal(hre.ethers.constants.AddressZero);
    });

    describe("newManager()", async function () {
      it("should revert when zero address", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.vestManagerFixture);

        const zeroAddress = hre.ethers.constants.AddressZero;
        await impersonateAccount(zeroAddress);
        const zeroAddrSigner = await hre.ethers.getSigner(zeroAddress);
        await expect(vestingManagerFactory.connect(zeroAddrSigner).newVestingManager()).to.be.revertedWith(
          "INVALID_OWNER"
        );
      });

      it("should successfully create new manager", async function () {
        const { vestingManagerFactory } = await loadFixture(this.fixtures.vestManagerFixture);

        const tx = await vestingManagerFactory.connect(this.signers.accounts[5]).newVestingManager();
        const receipt = await tx.wait();
        const event = receipt.events?.find((e: any) => e.event === "NewClone");
        const address = event?.args?.newClone;

        expect(address).to.not.equal(hre.ethers.constants.AddressZero);
      });

      it("should have initialized the manager", async function () {
        const { hydraDelegation, vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        expect(await vestManager.owner(), "owner").to.equal(this.vestManagerOwners[0].address);
        expect(await vestManager.HYDRA_DELEGATION(), "delegation").to.equal(hydraDelegation.address);
      });

      it("should set manager in mappings", async function () {
        const { vestManager, vestingManagerFactory } = await loadFixture(this.fixtures.vestManagerFixture);

        expect(
          await vestingManagerFactory.userVestManagers(this.vestManagerOwners[0].address, 0),
          "userVestManagers"
        ).to.equal(vestManager.address);
        expect(
          (await vestingManagerFactory.getUserVestingManagers(this.vestManagerOwners[0].address)).length,
          "getUserVestManagers"
        ).to.equal(1);
      });
    });

    describe("openVestedDelegatePosition()", async function () {
      it("should revert when not manager", async function () {
        const { hydraDelegation } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(
          hydraDelegation.connect(this.signers.accounts[3]).delegateWithVesting(this.signers.accounts[3].address, 1)
        ).to.be.revertedWithCustomError(hydraDelegation, "NotVestingManager");
      });

      it("should revert when not the vest manager owner", async function () {
        const { vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(
          vestManager
            .connect(this.signers.accounts[10])
            .openVestedDelegatePosition(this.signers.accounts[10].address, 1, { value: this.minDelegation })
        ).to.be.revertedWith(ERRORS.ownable);
      });

      it("should revert when validator is inactive", async function () {
        const { vestManager, hydraStaking } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(
          vestManager
            .connect(this.vestManagerOwners[0])
            .openVestedDelegatePosition(this.signers.accounts[10].address, 1, {
              value: this.minDelegation,
            })
        )
          .to.be.revertedWithCustomError(hydraStaking, ERRORS.unauthorized.name)
          .withArgs(ERRORS.unauthorized.inactiveStakerArg);
      });

      it("should revert when delegation too low", async function () {
        const { hydraDelegation, vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        await expect(
          vestManager
            .connect(this.vestManagerOwners[0])
            .openVestedDelegatePosition(this.signers.validators[2].address, 1, {
              value: this.minDelegation.div(2),
            })
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("delegate", "DELEGATION_TOO_LOW");
      });

      it("should properly open vesting position", async function () {
        const { vestManager } = await loadFixture(this.fixtures.vestManagerFixture);

        const vestingDuration = 52; // in weeks
        await expect(
          await vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
            value: this.minDelegation,
          })
        ).to.not.be.reverted;
      });

      it("should revert when maturing position", async function () {
        const { hydraDelegation, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // enter the reward maturity phase
        await time.increase(WEEK * VESTING_DURATION_WEEKS + 1);

        await expect(
          vestManager.openVestedDelegatePosition(this.delegatedValidators[0], VESTING_DURATION_WEEKS, {
            value: this.minDelegation,
          })
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "POSITION_MATURING");
      });

      it("should revert when active position", async function () {
        const { hydraDelegation, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        const vestingDuration = 52; // in weeks
        await expect(
          vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
            value: this.minDelegation,
          })
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "POSITION_ACTIVE");
      });

      it("should revert when reward not claimed", async function () {
        const { hydraDelegation, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // go beyond vesting period and maturing phases
        await time.increase(WEEK * 110);

        const vestingDuration = 52; // in weeks
        const currentReward = await hydraDelegation.getRawDelegatorReward(
          this.signers.validators[2].address,
          vestManager.address
        );

        expect(currentReward, "currentReward").to.be.gt(0);
        await expect(
          vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
            value: this.minDelegation,
          })
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "REWARDS_NOT_CLAIMED");
      });

      it("should successfully open vesting position again", async function () {
        const { hydraChain, hydraDelegation, vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // go beyond vesting period and maturing phases
        await time.increase(WEEK * 110);

        const vestingDuration = 52; // in weeks
        let currentReward = await hydraDelegation.getRawDelegatorReward(
          this.signers.validators[2].address,
          vestManager.address
        );

        await claimPositionRewards(hydraChain, hydraDelegation, vestManager, this.delegatedValidators[0]);

        currentReward = await hydraDelegation.getRawDelegatorReward(
          this.signers.validators[2].address,
          vestManager.address
        );
        expect(currentReward, "currentReward").to.be.equal(0);

        const delegatedAmount = await hydraDelegation.delegationOf(this.delegatedValidators[0], vestManager.address);
        const amountToDelegate = this.minDelegation.mul(2);
        const tx = await vestManager.openVestedDelegatePosition(this.delegatedValidators[0], vestingDuration, {
          value: amountToDelegate,
        });

        await expect(tx)
          .to.emit(hydraDelegation, "PositionOpened")
          .withArgs(vestManager.address, this.delegatedValidators[0], vestingDuration, amountToDelegate);

        expect(await hydraDelegation.delegationOf(this.delegatedValidators[0], vestManager.address)).to.be.equal(
          delegatedAmount.add(amountToDelegate)
        );
      });
    });

    describe("cutVestedDelegatePosition()", async function () {
      it("should revert if not vesting manager owner", async function () {
        const { vestManager } = await loadFixture(this.fixtures.vestedDelegationFixture);

        await expect(
          vestManager.connect(this.signers.accounts[10]).cutVestedDelegatePosition(this.delegatedValidators[0], 1)
        ).to.be.revertedWith(ERRORS.ownable);
      });

      it("should revert when insufficient balance", async function () {
        const { hydraDelegation, vestManager, liquidToken, vestingManagerFactory } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const balance = await hydraDelegation.delegationOf(this.delegatedValidators[0], vestManager.address);

        // send one more token so liquid tokens balance is enough
        const user2 = this.signers.accounts[7];
        await vestingManagerFactory.connect(user2).newVestingManager();
        const VestManagerFactory = new VestingManager__factory(this.vestManagerOwners[0]);
        const manager2 = await getUserManager(vestingManagerFactory, user2, VestManagerFactory);
        await manager2.openVestedDelegatePosition(this.delegatedValidators[0], 1, {
          value: this.minDelegation.mul(2),
        });

        await liquidToken.connect(user2).transfer(this.vestManagerOwners[0].address, 1);
        const balanceToCut = balance.add(1);
        await liquidToken
          .connect(this.vestManagerOwners[0])
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, balanceToCut)
          );
        // reverts with "0x11" which is not a custom error uint256 delegatedAmountLeft = delegatedAmount - amount;
        await expect(
          vestManager.cutVestedDelegatePosition(this.delegatedValidators[0], balanceToCut)
        ).to.be.revertedWithPanic("0x11");
      });

      it("should revert when delegation too low", async function () {
        const { hydraDelegation, vestManager, liquidToken } = await loadFixture(this.fixtures.vestedDelegationFixture);

        const balance = await hydraDelegation.delegationOf(this.delegatedValidators[0], vestManager.address);
        const balanceToCut = balance.sub(1);
        await liquidToken
          .connect(this.vestManagerOwners[0])
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, balanceToCut)
          );
        await expect(vestManager.cutVestedDelegatePosition(this.delegatedValidators[0], balanceToCut))
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("undelegate", "DELEGATION_TOO_LOW");
      });

      it("should revert if we try to cut the position in a epoch that is made balance change", async function () {
        const { hydraDelegation, vestManager, vestManagerOwner, liquidToken } = await loadFixture(
          this.fixtures.vestManagerFixture
        );

        const validator = this.signers.validators[2];
        await vestManager.openVestedDelegatePosition(validator.address, VESTING_DURATION_WEEKS, {
          value: this.minDelegation.mul(2),
        });

        await liquidToken
          .connect(vestManagerOwner)
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, this.minDelegation)
          );

        await expect(
          vestManager
            .connect(this.vestManagerOwners[0])
            .cutVestedDelegatePosition(validator.address, this.minDelegation)
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("_saveAccountParamsChange", "BALANCE_CHANGE_ALREADY_MADE");
      });

      it("should get staker penalty and rewards that will be burned, if closing from active position", async function () {
        const { systemHydraChain, hydraDelegation, vestManager, delegatedValidator, hydraStaking } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );
        // commit some more epochs to generate additional rewards
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          5, // number of epochs to commit
          this.epochSize
        );

        const position = await hydraDelegation.vestedDelegationPositions(
          delegatedValidator.address,
          vestManager.address
        );

        const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());
        // get the penalty and reward from the contract
        const penalty = await hydraDelegation.calculatePositionPenalty(
          delegatedValidator.address,
          vestManager.address,
          this.minDelegation
        );

        const reward = await calculateTotalPotentialPositionReward(
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );
        // calculate penalty locally
        const calculatedPenalty = await calculatePenalty(position, latestTimestamp, this.minStake);
        expect(penalty, "penalty").to.be.gt(0);
        expect(penalty, "penalty = calculatedPenalty").to.be.equal(calculatedPenalty);
        expect(reward, "reward").to.be.gt(0);
      });

      it("should slash the amount when in active position", async function () {
        const { hydraDelegation, liquidToken, vestManager, vestManagerOwner, delegatedValidator } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        // ensure position is active
        const isActive = await hydraDelegation.isActiveDelegatePosition(
          delegatedValidator.address,
          vestManager.address
        );
        expect(isActive, "isActive").to.be.true;

        // check is amount properly removed from delegation
        const delegatedBalanceBefore = await hydraDelegation.delegationOf(
          delegatedValidator.address,
          vestManager.address
        );

        const cutAmount = delegatedBalanceBefore.div(2);
        const position = await hydraDelegation.vestedDelegationPositions(
          delegatedValidator.address,
          vestManager.address
        );

        // Hydra TODO: Create table-driven unit tests with precalculated values to test the exact amounts
        // check if amount is properly burned
        // const end = position.end;
        // const rpsValues = await childValidatorSet.getRPSValues(validator);
        // const epochNum = findProperRPSIndex(rpsValues, end);
        // const balanceChangeIndex = 0;
        // let reward = await childValidatorSet.getDelegatorPositionReward(
        //   validator,
        //   manager.address,
        //   epochNum,
        //   balanceChangeIndex
        // );
        // reward = await childValidatorSet.applyMaxReward(reward);
        // const decrease = reward.add(amountToBeBurned);
        // await expect(manager.cutVestedDelegatePosition(validator, cutAmount)).to.changeEtherBalance(
        //   childValidatorSet,
        //   decrease.mul(-1)
        // );

        await liquidToken
          .connect(vestManagerOwner)
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, cutAmount)
          );

        const latestTimestamp = hre.ethers.BigNumber.from(await time.latest());
        const nextTimestamp = latestTimestamp.add(2);
        await time.setNextBlockTimestamp(nextTimestamp);
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, cutAmount);
        const penalty = await calculatePenalty(position, nextTimestamp, cutAmount);

        const delegatedBalanceAfter = await hydraDelegation.delegationOf(
          delegatedValidator.address,
          vestManager.address
        );
        expect(delegatedBalanceAfter, "delegatedBalanceAfter").to.be.eq(delegatedBalanceBefore.sub(cutAmount));

        // claimableRewards must be 0
        const claimableRewards = await hydraDelegation.getRawDelegatorReward(
          delegatedValidator.address,
          vestManager.address
        );
        expect(claimableRewards, "claimableRewards").to.be.eq(0);

        // check if amount is properly slashed
        const balanceBefore = await vestManagerOwner.getBalance();

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.connect(vestManagerOwner).withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        // should slash the delegator with the calculated penalty
        // cut half of the requested amount because half of the vesting period is still not passed
        expect(balanceAfter.sub(balanceBefore), "left balance").to.be.eq(cutAmount.sub(penalty));
        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(cutAmount.sub(penalty)));
      });

      it("should slash when undelegates exactly 1 week after the start of the vested position", async function () {
        const { hydraDelegation, liquidToken, vestManager, vestManagerOwner, delegatedValidator } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        // ensure position is active
        const isActive = await hydraDelegation.isActiveDelegatePosition(
          delegatedValidator.address,
          vestManager.address
        );
        expect(isActive, "isActive").to.be.true;

        // check is amount properly removed from delegation
        const delegatedBalance = await hydraDelegation.delegationOf(delegatedValidator.address, vestManager.address);
        const position = await hydraDelegation.vestedDelegationPositions(
          delegatedValidator.address,
          vestManager.address
        );

        await liquidToken
          .connect(vestManagerOwner)
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, delegatedBalance)
          );

        const nextTimestamp = position.start.add(WEEK);
        await time.setNextBlockTimestamp(nextTimestamp);
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedBalance);

        // hardcode the penalty percent by 1% a week (9 weeks should be left)
        const penalty = await calculatePenaltyByWeeks(VESTING_DURATION_WEEKS - 1, delegatedBalance);

        const delegatedBalanceAfter = await hydraDelegation.delegationOf(
          delegatedValidator.address,
          vestManager.address
        );
        expect(delegatedBalanceAfter, "delegatedBalanceAfter").to.be.eq(0);

        // claimableRewards must be 0
        const claimableRewards = await hydraDelegation.getRawDelegatorReward(
          delegatedValidator.address,
          vestManager.address
        );
        expect(claimableRewards, "claimableRewards").to.be.eq(0);

        // check if amount is properly slashed
        const balanceBefore = await vestManagerOwner.getBalance();

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.connect(vestManagerOwner).withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        // should slash the delegator with the calculated penalty
        expect(balanceAfter.sub(balanceBefore), "left balance").to.be.eq(delegatedBalance.sub(penalty));
        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(delegatedBalance.sub(penalty)));
      });

      it("should properly cut position", async function () {
        const {
          systemHydraChain,
          hydraDelegation,
          liquidToken,
          vestManager,
          vestManagerOwner,
          delegatedValidator,
          hydraStaking,
        } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // commit Epoch so reward is made
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          3,
          this.epochSize
        );

        const reward = await hydraDelegation.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        expect(reward, "reward").to.not.be.eq(0);

        // Finish the vesting period
        await time.increase(WEEK * 60);

        const balanceBefore = await vestManagerOwner.getBalance();
        const delegatedBalance = await hydraDelegation.delegationOf(delegatedValidator.address, vestManager.address);
        expect(delegatedBalance, "delegatedBalance").to.not.be.eq(0);

        await liquidToken
          .connect(vestManagerOwner)
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, delegatedBalance)
          );
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedBalance);

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.connect(vestManagerOwner).withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(delegatedBalance));

        // check is amount properly removed from delegation
        expect(await hydraDelegation.delegationOf(delegatedValidator.address, vestManager.address)).to.be.eq(0);

        // ensure reward is still available for withdrawal
        const rewardAfter = await hydraDelegation.getRawDelegatorReward(
          delegatedValidator.address,
          vestManager.address
        );
        expect(rewardAfter).to.be.eq(reward);
      });

      it("should delete position when closing it", async function () {
        const { hydraDelegation, liquidToken, vestManager, vestManagerOwner, delegatedValidator } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        // cut the whole position
        const delegatedAmount = await hydraDelegation.delegationOf(delegatedValidator.address, vestManager.address);
        await liquidToken
          .connect(vestManagerOwner)
          .approve(
            vestManager.address,
            await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, delegatedAmount)
          );
        await vestManager.cutVestedDelegatePosition(delegatedValidator.address, delegatedAmount);
        expect(
          (await hydraDelegation.vestedDelegationPositions(delegatedValidator.address, vestManager.address)).start
        ).to.be.eq(0);
      });
    });

    describe("cutVestedDelegatePositionWithPermit()", async function () {
      it("should revert when not the vest manager owner", async function () {
        const { vestManager, liquidToken, vestManagerOwner, hydraDelegation } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const { v, r, s } = await getPermitSignature(
          vestManagerOwner,
          liquidToken,
          vestManager.address,
          await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, this.minDelegation),
          DEADLINE
        );

        await expect(
          vestManager
            .connect(this.signers.accounts[7])
            .cutVestedDelegatePositionWithPermit(vestManagerOwner.address, this.minDelegation, DEADLINE, v, r, s)
        ).to.be.revertedWith(ERRORS.ownable);
      });

      it("should revert on wrong deadline", async function () {
        const { hydraDelegation, vestManager, liquidToken, vestingManagerFactory } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const balance = await hydraDelegation.delegationOf(this.delegatedValidators[0], vestManager.address);

        // send one more token so liquid tokens balance is enough
        const user2 = this.signers.accounts[7];
        await vestingManagerFactory.connect(user2).newVestingManager();
        const VestManagerFactory = new VestingManager__factory(this.vestManagerOwners[0]);
        const manager2 = await getUserManager(vestingManagerFactory, user2, VestManagerFactory);
        await manager2.openVestedDelegatePosition(this.delegatedValidators[0], 1, {
          value: this.minDelegation.mul(2),
        });

        await liquidToken.connect(user2).transfer(this.vestManagerOwners[0].address, 1);
        const balanceToCut = balance.add(1);
        const { v, r, s } = await getPermitSignature(
          this.vestManagerOwners[0],
          liquidToken,
          vestManager.address,
          await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, balanceToCut),
          DEADLINE
        );

        await expect(
          vestManager.cutVestedDelegatePositionWithPermit(this.delegatedValidators[0], balanceToCut, "1242144", v, r, s)
        ).to.be.revertedWith("ERC20Permit: expired deadline");
      });

      it("should revert on wrong signature", async function () {
        const { hydraDelegation, vestManager, liquidToken, vestingManagerFactory } = await loadFixture(
          this.fixtures.vestedDelegationFixture
        );

        const balance = await hydraDelegation.delegationOf(this.delegatedValidators[0], vestManager.address);

        // send one more token so liquid tokens balance is enough
        const user2 = this.signers.accounts[7];
        await vestingManagerFactory.connect(user2).newVestingManager();
        const VestManagerFactory = new VestingManager__factory(this.vestManagerOwners[0]);
        const manager2 = await getUserManager(vestingManagerFactory, user2, VestManagerFactory);
        await manager2.openVestedDelegatePosition(this.delegatedValidators[0], 1, {
          value: this.minDelegation.mul(2),
        });

        await liquidToken.connect(user2).transfer(this.vestManagerOwners[0].address, 1);
        const balanceToCut = balance.add(1);
        const { v, r, s } = await getPermitSignature(
          this.vestManagerOwners[0],
          liquidToken,
          vestManager.address,
          await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, balanceToCut),
          DEADLINE
        );

        await expect(
          vestManager.cutVestedDelegatePositionWithPermit(
            this.delegatedValidators[0],
            balanceToCut.add(1),
            DEADLINE,
            v,
            r,
            s
          )
        ).to.be.revertedWith("ERC20Permit: invalid signature");
      });

      it("should properly cut position with permit", async function () {
        const {
          systemHydraChain,
          hydraDelegation,
          liquidToken,
          vestManager,
          vestManagerOwner,
          delegatedValidator,
          hydraStaking,
        } = await loadFixture(this.fixtures.vestedDelegationFixture);

        // commit Epoch so reward is made
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          3,
          this.epochSize
        );

        const reward = await hydraDelegation.getRawDelegatorReward(delegatedValidator.address, vestManager.address);
        expect(reward, "reward").to.not.be.eq(0);

        // Finish the vesting period
        await time.increase(WEEK * 60);

        const balanceBefore = await vestManagerOwner.getBalance();
        const delegatedBalance = await hydraDelegation.delegationOf(delegatedValidator.address, vestManager.address);
        expect(delegatedBalance, "delegatedBalance").to.not.be.eq(0);

        const { v, r, s } = await getPermitSignature(
          vestManagerOwner,
          liquidToken,
          vestManager.address,
          await hydraDelegation.calculateOwedLiquidTokens(vestManager.address, delegatedBalance),
          DEADLINE
        );

        // check liquid tokens to collect value
        await expect(
          vestManager.cutVestedDelegatePositionWithPermit(
            delegatedValidator.address,
            delegatedBalance,
            DEADLINE,
            v,
            r,
            s
          )
        ).to.changeTokenBalance(
          LiquidityToken__factory.connect(await hydraDelegation.liquidToken(), hre.ethers.provider),
          await vestManager.owner(),
          calcLiquidTokensToDistributeOnVesting(VESTING_DURATION_WEEKS, delegatedBalance).mul(-1)
        );

        // increase time so reward is available to be withdrawn
        await time.increase(WEEK);
        await vestManager.connect(vestManagerOwner).withdraw(vestManagerOwner.address);

        const balanceAfter = await vestManagerOwner.getBalance();

        expect(balanceAfter, "balanceAfter").to.be.eq(balanceBefore.add(delegatedBalance));

        // check is amount properly removed from delegation
        expect(await hydraDelegation.delegationOf(delegatedValidator.address, vestManager.address)).to.be.eq(0);

        // ensure reward is still available for withdrawal
        const rewardAfter = await hydraDelegation.getRawDelegatorReward(
          delegatedValidator.address,
          vestManager.address
        );
        expect(rewardAfter).to.be.eq(reward);
      });
    });

    describe("getDelegatorPositionReward()", async function () {
      it("should revert with invalid epoch", async function () {
        const { systemHydraChain, hydraChain, hydraStaking, hydraDelegation, vestManager, delegatedValidator } =
          await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

        // commit epochs to distribute some rewards and mature the position
        await commitEpochs(
          systemHydraChain,
          hydraStaking,
          [delegatedValidator],
          3, // number of epochs to commit
          this.epochSize,
          WEEK
        );

        // prepare params for call
        const { balanceChangeIndex } = await retrieveRPSData(
          hydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        await expect(
          hydraDelegation.getDelegatorPositionReward(
            delegatedValidator.address,
            vestManager.address,
            0,
            balanceChangeIndex
          )
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "INVALID_EPOCH");
      });

      it("should revert with wrong rps", async function () {
        const { systemHydraChain, hydraChain, hydraStaking, hydraDelegation, vestManager, delegatedValidator } =
          await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

        // finish the vesting period
        await time.increase(WEEK * 52);

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await retrieveRPSData(
          hydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        // commit epoch
        await commitEpoch(
          systemHydraChain,
          hydraStaking,
          [this.signers.validators[0], this.signers.validators[1], delegatedValidator],
          this.epochSize
        );

        await expect(
          hydraDelegation.getDelegatorPositionReward(
            delegatedValidator.address,
            vestManager.address,
            epochNum + 1,
            balanceChangeIndex
          )
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "WRONG_RPS");
      });

      it("should revert with invalid params index", async function () {
        const { systemHydraChain, hydraChain, hydraStaking, hydraDelegation, vestManager, oldValidator, newValidator } =
          await loadFixture(this.fixtures.swappedPositionFixture);

        // commit epochs and increase time to make the position matured & commit epochs
        await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 4, this.epochSize, WEEK);

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await retrieveRPSData(
          hydraChain,
          hydraDelegation,
          newValidator.address,
          vestManager.address
        );

        await expect(
          hydraDelegation.getDelegatorPositionReward(
            newValidator.address,
            vestManager.address,
            epochNum,
            balanceChangeIndex + 1
          )
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", ERRORS.vesting.invalidParamsIndex);
      });

      it("should revert when get reward with late balance", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation, vestManager, oldValidator, newValidator } =
          await loadFixture(this.fixtures.swappedPositionFixture);

        const swapEpoch = await systemHydraChain.currentEpochId();

        // commit few frequent epochs to generate some more rewards
        await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 5, this.epochSize);

        // commit 4 epochs, 1 week each in order to mature the position and be able to claim
        await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 4, this.epochSize, WEEK + 1);

        // prepare params for call
        const { balanceChangeIndex } = await retrieveRPSData(
          systemHydraChain,
          hydraDelegation,
          oldValidator.address,
          vestManager.address
        );

        await expect(
          hydraDelegation.getDelegatorPositionReward(
            oldValidator.address,
            vestManager.address,
            swapEpoch.sub(1),
            balanceChangeIndex
          )
        )
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "LATE_BALANCE_CHANGE");
      });

      it("should revert when get reward with early balance", async function () {
        const { systemHydraChain, hydraStaking, hydraDelegation, vestManager, oldValidator, newValidator } =
          await loadFixture(this.fixtures.swappedPositionFixture);

        // commit few frequent epochs to generate some more rewards
        await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 5, this.epochSize);

        // commit 4 epochs, 1 week each in order to mature the position and be able to claim
        await commitEpochs(systemHydraChain, hydraStaking, [oldValidator, newValidator], 4, this.epochSize, WEEK + 1);

        // prepare params for call
        const { epochNum } = await retrieveRPSData(
          systemHydraChain,
          hydraDelegation,
          oldValidator.address,
          vestManager.address
        );

        await expect(hydraDelegation.getDelegatorPositionReward(oldValidator.address, vestManager.address, epochNum, 0))
          .to.be.revertedWithCustomError(hydraDelegation, "DelegateRequirement")
          .withArgs("vesting", "EARLY_BALANCE_CHANGE");
      });

      it("should return 0 reward if the position is non-existing one", async function () {
        const { hydraChain, hydraDelegation, vestManager, delegatedValidator } = await loadFixture(
          this.fixtures.weeklyVestedDelegationFixture
        );

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await retrieveRPSData(
          hydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        const reward = await hydraDelegation.getDelegatorPositionReward(
          delegatedValidator.address,
          this.signers.accounts[5].address,
          epochNum,
          balanceChangeIndex
        );
        expect(reward).to.be.eq(0);
      });

      it("should return 0 reward if the position is still active", async function () {
        const { hydraChain, hydraDelegation, vestManager, delegatedValidator } = await loadFixture(
          this.fixtures.weeklyVestedDelegationFixture
        );

        // prepare params for call
        const { epochNum, balanceChangeIndex } = await retrieveRPSData(
          hydraChain,
          hydraDelegation,
          delegatedValidator.address,
          vestManager.address
        );

        const reward = await hydraDelegation.getDelegatorPositionReward(
          delegatedValidator.address,
          vestManager.address,
          epochNum,
          balanceChangeIndex
        );
        expect(reward).to.be.eq(0);
      });

      describe("getDelegatorPositionReward() With Vesting", async function () {
        it("should get no rewards if the position is still active", async function () {
          const { systemHydraChain, hydraChain, hydraDelegation, hydraStaking, vestingManagerFactory } =
            await loadFixture(this.fixtures.delegatedFixture);

          const validator = this.signers.validators[1];
          const manager = await createManagerAndVest(
            vestingManagerFactory,
            this.signers.accounts[4],
            validator.address,
            VESTING_DURATION_WEEKS,
            this.minDelegation
          );

          // commit epochs to distribute rewards
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], validator],
            5, // number of epochs to commit
            this.epochSize,
            DAY * 3 // three days per epoch, so, 3 x 5 = 15 days ahead
          );

          const managerRewards = await getDelegatorPositionReward(
            hydraChain,
            hydraDelegation,
            validator.address,
            manager.address
          );

          expect(managerRewards).to.equal(0);
        });

        it("should generate partial rewards when enter maturing period", async function () {
          const { systemHydraChain, hydraStaking, hydraDelegation, vestManager, delegatedValidator } =
            await loadFixture(this.fixtures.weeklyVestedDelegationFixture);

          // commit epoch so some more rewards are distributed
          await commitEpoch(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], delegatedValidator],
            this.epochSize,
            WEEK + 1
          );

          const managerRewards = await getDelegatorPositionReward(
            systemHydraChain,
            hydraDelegation,
            delegatedValidator.address,
            vestManager.address
          );

          const totalPotentialRewards = await calculateTotalPotentialPositionReward(
            hydraDelegation,
            delegatedValidator.address,
            vestManager.address
          );

          expect(managerRewards).to.be.lessThan(totalPotentialRewards);
        });

        it("should have the same rewards if the position size and period are the same", async function () {
          const { systemHydraChain, hydraStaking, hydraDelegation, vestingManagerFactory } = await loadFixture(
            this.fixtures.delegatedFixture
          );

          const validator = this.signers.validators[2];
          const manager1 = await createManagerAndVest(
            vestingManagerFactory,
            this.signers.accounts[4],
            validator.address,
            VESTING_DURATION_WEEKS,
            this.minDelegation
          );
          const manager2 = await createManagerAndVest(
            vestingManagerFactory,
            this.signers.accounts[4],
            validator.address,
            VESTING_DURATION_WEEKS,
            this.minDelegation
          );

          // Commit epochs so rewards to be distributed
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], validator],
            5, // number of epochs to commit
            this.epochSize,
            DAY * 3 // three days per epoch, so, 3 x 5 = 15 days ahead
          );

          const manager1rewards = await calculateTotalPotentialPositionReward(
            hydraDelegation,
            validator.address,
            manager1.address
          );
          const manager2rewards = await calculateTotalPotentialPositionReward(
            hydraDelegation,
            validator.address,
            manager2.address
          );

          expect(manager1rewards).to.equal(manager2rewards);
        });

        it("should have different rewards if the position period differs", async function () {
          const { systemHydraChain, hydraStaking, hydraDelegation, vestingManagerFactory } = await loadFixture(
            this.fixtures.delegatedFixture
          );

          const validator = this.signers.validators[2];
          const manager1 = await createManagerAndVest(
            vestingManagerFactory,
            this.signers.accounts[4],
            validator.address,
            VESTING_DURATION_WEEKS,
            this.minDelegation
          );
          const manager2 = await createManagerAndVest(
            vestingManagerFactory,
            this.signers.accounts[4],
            validator.address,
            52, // max weeks
            this.minDelegation
          );

          // Commit epochs so rewards to be distributed
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], validator],
            7, // number of epochs to commit
            this.epochSize,
            DAY * 3 // three days per epoch, so, 3 x 7 = 21 days ahead
          );

          const manager1rewards = await calculateTotalPotentialPositionReward(
            hydraDelegation,
            validator.address,
            manager1.address
          );
          const manager2rewards = await calculateTotalPotentialPositionReward(
            hydraDelegation,
            validator.address,
            manager2.address
          );

          expect(manager2rewards).to.be.greaterThan(manager1rewards);
        });

        it("should have different rewards when the position differs", async function () {
          const { systemHydraChain, hydraStaking, hydraDelegation, vestingManagerFactory } = await loadFixture(
            this.fixtures.delegatedFixture
          );

          const validator = this.signers.validators[2];
          const manager1 = await createManagerAndVest(
            vestingManagerFactory,
            this.signers.accounts[4],
            validator.address,
            VESTING_DURATION_WEEKS,
            this.minDelegation.mul(2)
          );
          const manager2 = await createManagerAndVest(
            vestingManagerFactory,
            this.signers.accounts[4],
            validator.address,
            VESTING_DURATION_WEEKS,
            this.minDelegation
          );

          // commit epochs so rewards to be distributed
          await commitEpochs(
            systemHydraChain,
            hydraStaking,
            [this.signers.validators[0], this.signers.validators[1], validator],
            5, // number of epochs to commit
            this.epochSize,
            WEEK // one week = 1 epoch
          );

          const manager1rewards = await calculateTotalPotentialPositionReward(
            hydraDelegation,
            validator.address,
            manager1.address
          );
          const manager2rewards = await calculateTotalPotentialPositionReward(
            hydraDelegation,
            validator.address,
            manager2.address
          );

          expect(manager1rewards).to.be.greaterThan(manager2rewards);
        });
      });
      // TODO: More tests with actual calculation results checks must be made
    });
  });
}
