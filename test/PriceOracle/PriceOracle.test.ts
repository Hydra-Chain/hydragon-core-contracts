import { ethers, network } from "hardhat";
/* eslint-disable node/no-extraneous-import */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";

import * as mcl from "../../ts/mcl";
import { CHAIN_ID, DAY, DOMAIN, ERRORS, INITIAL_PRICE, MAX_ACTIVE_VALIDATORS } from "../constants";
import { commitEpoch, getCorrectVotingTimestamp, getCurrentDay } from "../helper";

export function RunPriceOracleTests(): void {
  describe("Initialization", function () {
    it("should validate default values when PriceOracle is deployed", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

      expect(await priceOracle.VOTING_POWER_PERCENTAGE_NEEDED()).to.equal(61);
      expect(await priceOracle.hydraChainContract()).to.equal(ethers.constants.AddressZero);
      expect(await priceOracle.aprCalculatorContract()).to.equal(ethers.constants.AddressZero);
    });

    it("should revert when initialize without system call", async function () {
      const { priceOracle, hydraChain, aprCalculator } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

      await expect(priceOracle.initialize(hydraChain.address, aprCalculator.address))
        .to.be.revertedWithCustomError(priceOracle, ERRORS.unauthorized.name)
        .withArgs(ERRORS.unauthorized.systemCallArg);
    });

    it("should initialize successfully", async function () {
      const { priceOracle, hydraChain, aprCalculator } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      expect(await priceOracle.hydraChainContract()).to.equal(hydraChain.address);
      expect(await priceOracle.aprCalculatorContract()).to.equal(aprCalculator.address);
    });

    it("should revert re-initializing attempt", async function () {
      const { priceOracle, hydraChain, aprCalculator } = await loadFixture(
        this.fixtures.initializedHydraChainStateFixture
      );

      await expect(priceOracle.initialize(hydraChain.address, aprCalculator.address)).to.be.revertedWith(
        ERRORS.initialized
      );
    });
  });

  describe("Voting for price", function () {
    const correctVotingTime = getCorrectVotingTimestamp();

    it("should revert vote with 0 price", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      await expect(priceOracle.connect(this.signers.validators[0]).vote(0)).to.be.revertedWithCustomError(
        priceOracle,
        "InvalidPrice"
      );
    });

    it("should revert vote with price bigger than max uint224", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

      const maxUint224 = BigNumber.from(2).pow(224).sub(1);

      await expect(
        priceOracle.connect(this.signers.validators[0]).vote(maxUint224.add(1))
      ).to.be.revertedWithCustomError(priceOracle, "InvalidPrice");
    });

    it("should revert when not in voting time", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      const now = new Date();
      let incorrectTimestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 0, 0, 0);
      incorrectTimestamp = Math.floor(incorrectTimestamp / 1000);
      await time.setNextBlockTimestamp(incorrectTimestamp);

      await expect(priceOracle.connect(this.signers.validators[2]).vote(21))
        .to.be.revertedWithCustomError(priceOracle, "InvalidVote")
        .withArgs("NOT_VOTING_TIME");
    });

    it("should revert when vote with non-active validator", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      await expect(priceOracle.connect(this.signers.validators[2]).vote(21))
        .to.be.revertedWithCustomError(priceOracle, "InvalidVote")
        .withArgs("NOT_VALIDATOR");
    });

    it("should vote successfully", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      // increase + 1 because the next block is with time of the next day
      const nextBlockDay = (await getCurrentDay()) + 1;

      await expect(priceOracle.connect(this.signers.validators[0]).vote(21))
        .to.emit(priceOracle, "PriceVoted")
        .withArgs(21, this.signers.validators[0].address, nextBlockDay);

      const pricesForDay = await priceOracle.priceVotesForDay(nextBlockDay);
      expect(pricesForDay.head).to.equal(this.signers.validators[0].address);
      expect(pricesForDay.size).to.equal(1);
    });

    it("should revert vote when price for the day is updated", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      await priceOracle.connect(this.signers.validators[0]).vote(21);
      await priceOracle.connect(this.signers.validators[1]).vote(21);
      await priceOracle.connect(this.signers.validators[2]).vote(21);

      await expect(priceOracle.connect(this.signers.validators[1]).vote(25))
        .to.be.revertedWithCustomError(priceOracle, "InvalidVote")
        .withArgs("PRICE_ALREADY_SET");
    });

    it("should revert double voting in the same day", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      await priceOracle.connect(this.signers.validators[0]).vote(21);

      await expect(priceOracle.connect(this.signers.validators[0]).vote(25))
        .to.be.revertedWithCustomError(priceOracle, "InvalidVote")
        .withArgs("ALREADY_VOTED");
    });
  });

  describe("Price update", function () {
    const correctVotingTime = getCorrectVotingTimestamp();

    it("should not update price if votes are less than 3 active validators vote for price, even if others have enough power", async function () {
      const { priceOracle, hydraChain } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      await priceOracle.connect(this.signers.validators[0]).vote(21);
      const validatorsData = [
        { validator: this.signers.validators[0].address, votingPower: 0 },
        { validator: this.signers.validators[1].address, votingPower: 50 },
        { validator: this.signers.validators[2].address, votingPower: 50 },
      ];
      await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

      await priceOracle.connect(this.signers.validators[1]).vote(21);
      await expect(priceOracle.connect(this.signers.validators[2]).vote(21)).to.not.emit(priceOracle, "PriceUpdated");
    });

    it("should not update price if not enough power is reached", async function () {
      const { priceOracle, hydraChain } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      const validatorsData = [
        { validator: this.signers.validators[0].address, votingPower: 1 },
        { validator: this.signers.validators[1].address, votingPower: 1 },
        { validator: this.signers.validators[2].address, votingPower: 1 },
      ];
      await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

      await priceOracle.connect(this.signers.validators[0]).vote(21);
      await priceOracle.connect(this.signers.validators[1]).vote(21);
      await expect(priceOracle.connect(this.signers.validators[2]).vote(21)).to.not.emit(priceOracle, "PriceUpdated");
    });

    it("should not update price if validators vote for different prices", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      await priceOracle.connect(this.signers.validators[0]).vote(21);
      await priceOracle.connect(this.signers.validators[1]).vote(25);
      await expect(priceOracle.connect(this.signers.validators[2]).vote(30)).to.not.emit(priceOracle, "PriceUpdated");
      await expect(priceOracle.connect(this.signers.validators[3]).vote(35)).to.not.emit(priceOracle, "PriceUpdated");
    });

    it("should not update price, if there is is not enough power for a price (rounding to 1%)", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      await priceOracle.connect(this.signers.validators[0]).vote(10);
      await priceOracle.connect(this.signers.validators[1]).vote(14);
      await priceOracle.connect(this.signers.validators[2]).vote(18);
      await expect(priceOracle.connect(this.signers.validators[3]).vote(24)).to.not.emit(priceOracle, "PriceUpdated");
    });

    it("should update price successfully", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      // increase + 1 because the next block is with time of the next day
      const currentDay = (await getCurrentDay()) + 1;

      await priceOracle.connect(this.signers.validators[0]).vote(221);
      await priceOracle.connect(this.signers.validators[1]).vote(221);
      await expect(priceOracle.connect(this.signers.validators[2]).vote(221))
        .to.emit(priceOracle, "PriceUpdated")
        .withArgs(221, currentDay);
      expect(await priceOracle.pricePerDay(currentDay)).to.equal(221);
    });

    it("should update price if 61% power agrees on price (rounding to 1%), even if other validators voted for different price", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      // increase + 1 because the next block is with time of the next day
      const currentDay = (await getCurrentDay()) + 1;

      await priceOracle.connect(this.signers.validators[0]).vote(142);
      await priceOracle.connect(this.signers.validators[1]).vote(56);
      await priceOracle.connect(this.signers.validators[2]).vote(56);
      await expect(priceOracle.connect(this.signers.validators[3]).vote(56))
        .to.emit(priceOracle, "PriceUpdated")
        .withArgs(56, currentDay);
    });

    it("should update the average price of votes (if they are all around the same value to 1% one after another)", async function () {
      const { priceOracle } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      // increase + 1 because the next block is with time of the next day
      const currentDay = (await getCurrentDay()) + 1;

      const price1 = 222222221;
      const price2 = 222222222;
      const price3 = 222222228;
      const expectedPrice = Math.floor((price1 + price2 + price3) / 3);

      await priceOracle.connect(this.signers.validators[0]).vote(price1);
      await priceOracle.connect(this.signers.validators[1]).vote(price2);
      await priceOracle.connect(this.signers.validators[2]).vote(1);
      await expect(priceOracle.connect(this.signers.validators[3]).vote(price3))
        .to.emit(priceOracle, "PriceUpdated")
        .withArgs(expectedPrice, currentDay);
    });

    it("should not revert vote if APRCalculator priceUpdate fails, it does not update the price & emit event for fail", async function () {
      const { hydraChain } = await loadFixture(this.fixtures.validatorsDataStateFixture);

      await time.setNextBlockTimestamp(correctVotingTime);

      // increase + 1 because the next block is with time of the next day
      const currentDay = (await getCurrentDay()) + 1;
      const newPriceOracleContract = await (await ethers.getContractFactory("PriceOracle")).deploy();
      await newPriceOracleContract.connect(this.signers.system).initialize(hydraChain.address, hydraChain.address);

      await newPriceOracleContract.connect(this.signers.validators[0]).vote(56);
      await newPriceOracleContract.connect(this.signers.validators[1]).vote(56);
      await newPriceOracleContract.connect(this.signers.validators[2]).vote(56);
      const lastVote = await newPriceOracleContract.connect(this.signers.validators[3]).vote(56);
      await expect(lastVote).to.emit(newPriceOracleContract, "PriceUpdateFailed");
      await expect(lastVote).to.not.emit(newPriceOracleContract, "PriceUpdated");
      expect(await newPriceOracleContract.pricePerDay(currentDay)).to.equal(0);
    });
  });

  describe.skip("Price Many voters", function () {
    it("should vote with many validators", async function () {
      const { systemHydraChain, hydraStaking, priceOracle } = await loadFixture(
        this.fixtures.validatorsDataStateFixture
      );
      expect(await systemHydraChain.getActiveValidatorsCount()).to.be.equal(5);

      const keyPair = mcl.newKeyPair();
      const provider = ethers.provider;
      const initialBalance = ethers.utils.parseEther("100000");
      const newValidatorAddresses = [];

      // * Whitelist & Register & Stake & Update Power
      for (let i = 5; i < MAX_ACTIVE_VALIDATORS; i++) {
        // create a new wallet and signature
        const wallet = ethers.Wallet.createRandom();
        const connectedWallet = wallet.connect(provider);
        const validatorsData = [{ validator: wallet.address, votingPower: 20 }];
        const signature = mcl.signValidatorMessage(DOMAIN, CHAIN_ID, wallet.address, keyPair.secret).signature;

        // send eth to wallet
        await network.provider.send("hardhat_setBalance", [
          wallet.address,
          initialBalance.toHexString().replace(/^0x0+/, "0x"),
        ]);

        // whitelist, register & stake
        await systemHydraChain.connect(this.signers.governance).addToWhitelist([wallet.address]);
        await systemHydraChain
          .connect(connectedWallet)
          .register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey), 0);
        await hydraStaking.connect(connectedWallet).stake({ value: this.minStake });
        await systemHydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

        newValidatorAddresses.push(connectedWallet);
      }
      expect(await systemHydraChain.getActiveValidatorsCount()).to.be.equal(MAX_ACTIVE_VALIDATORS);
      await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[0]], this.epochSize);
      const correctVotingTime = getCorrectVotingTimestamp();
      await time.setNextBlockTimestamp(correctVotingTime + 10 * DAY);

      for (let i = 1; i < 92; i++) {
        let valueToVote;
        if (i % 2 === 0) {
          valueToVote = INITIAL_PRICE + INITIAL_PRICE * (i / 100000);
        } else {
          valueToVote = INITIAL_PRICE - INITIAL_PRICE * (i / 100000);
        }
        console.log("Vote", i + " : ", valueToVote);
        await priceOracle.connect(newValidatorAddresses[i]).vote(valueToVote * 1000);
      }
      await expect(priceOracle.connect(newValidatorAddresses[100]).vote(INITIAL_PRICE * 1000)).to.emit(
        priceOracle,
        "PriceUpdated"
      );
    });
  });
}
