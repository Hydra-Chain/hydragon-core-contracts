/* eslint-disable node/no-extraneous-import */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";

import * as mcl from "../ts/mcl";
import {
  APRCalculator__factory,
  BLS__factory,
  HydraChain__factory,
  HydraDelegation__factory,
  HydraStaking__factory,
  HydraVault__factory,
  LiquidityToken__factory,
  PriceOracle__factory,
  RewardWallet__factory,
  VestingManagerFactory__factory,
} from "../typechain-types";
import {
  DAY,
  INITIAL_COMMISSION,
  INITIAL_PRICE,
  INITIAL_PRICES_TO_REACH_BONUSES,
  SLOW_SMA,
  SYSTEM,
  VESTING_DURATION_WEEKS,
  WEEK,
} from "./constants";
import {
  commitEpochs,
  registerValidator,
  createNewVestManager,
  generateValidatorBls,
  commitEpoch,
  getCorrectVotingTimestamp,
} from "./helper";
import { expect } from "chai";

// --------------- Deploying Contracts ---------------

async function blsFixtureFunction(this: Mocha.Context) {
  const BLSFactory = new BLS__factory(this.signers.admin);
  const BLS = await BLSFactory.deploy();

  return BLS;
}

async function liquidityTokenFixtureFunction(this: Mocha.Context) {
  const LiquidityTokenFactory = new LiquidityToken__factory(this.signers.admin);
  const liquidityToken = await LiquidityTokenFactory.deploy();

  return liquidityToken;
}

async function HydraDelegationFixtureFunction(this: Mocha.Context) {
  const hydraDelegationFactory = new HydraDelegation__factory(this.signers.admin);
  const hydraDelegation = await hydraDelegationFactory.deploy();

  return hydraDelegation;
}

async function HydraStakingFixtureFunction(this: Mocha.Context) {
  const hydraStakingFactory = new HydraStaking__factory(this.signers.admin);
  const hydraStaking = await hydraStakingFactory.deploy();

  return hydraStaking;
}

async function aprCalculatorFixtureFunction(this: Mocha.Context) {
  const aprCalculatorFactory = new APRCalculator__factory(this.signers.admin);
  const aprCalculator = await aprCalculatorFactory.deploy();

  return aprCalculator;
}

async function VestingManagerFactoryFixtureFunction(this: Mocha.Context) {
  const vestingManagerFactoryFactory = new VestingManagerFactory__factory(this.signers.admin);
  const vestingManagerFactory = await vestingManagerFactoryFactory.deploy();

  return vestingManagerFactory;
}

async function PriceOracleFixtureFunction(this: Mocha.Context) {
  const priceOracleFactory = new PriceOracle__factory(this.signers.admin);
  const priceOracle = await priceOracleFactory.deploy();

  return priceOracle;
}

async function RewardWalletFixtureFunction(this: Mocha.Context) {
  const rewardWalletFactory = new RewardWallet__factory(this.signers.admin);
  const rewardWallet = await rewardWalletFactory.deploy();

  return rewardWallet;
}

async function hydraVaultFixtureFunction(this: Mocha.Context) {
  const hydraVaultFactory = new HydraVault__factory(this.signers.admin);
  const daoIncentiveVaultAddr = await hydraVaultFactory.deploy();

  return daoIncentiveVaultAddr;
}

async function presetHydraChainStateFixtureFunction(this: Mocha.Context) {
  const HydraChainFactory = new HydraChain__factory(this.signers.admin);
  const hydraChain = await HydraChainFactory.deploy();

  await hre.network.provider.send("hardhat_setBalance", [SYSTEM, "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"]);

  // TODO: remove this once we have a better way to set balance from Polygon
  // Need otherwise burn mechanism doesn't work
  await hre.network.provider.send("hardhat_setBalance", [
    hydraChain.address,
    "0x2CD76FE086B93CE2F768A00B22A00000000000",
  ]);

  await hre.network.provider.send("hardhat_setBalance", [
    "0x0000000000000000000000000000000000001001",
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  ]);

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [SYSTEM],
  });

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x0000000000000000000000000000000000001001"],
  });

  const systemHydraChain = hydraChain.connect(this.signers.system);
  const bls = await blsFixtureFunction.bind(this)();
  const liquidToken = await liquidityTokenFixtureFunction.bind(this)();
  const hydraDelegation = await HydraDelegationFixtureFunction.bind(this)();
  const hydraStaking = await HydraStakingFixtureFunction.bind(this)();
  const aprCalculator = await aprCalculatorFixtureFunction.bind(this)();
  const vestingManagerFactory = await VestingManagerFactoryFixtureFunction.bind(this)();
  const priceOracle = await PriceOracleFixtureFunction.bind(this)();
  const rewardWallet = await RewardWalletFixtureFunction.bind(this)();
  const DAOIncentiveVault = await hydraVaultFixtureFunction.bind(this)();

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    liquidToken,
    aprCalculator,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
    DAOIncentiveVault,
  };
}

// --------------- Initializing Contracts ---------------

async function initializedHydraChainStateFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    liquidToken,
    aprCalculator,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
    DAOIncentiveVault,
  } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

  await mcl.init();
  const validatorBls = generateValidatorBls(this.signers.admin);
  const validatorInit = {
    addr: this.signers.admin.address,
    pubkey: validatorBls.pubkey,
    signature: validatorBls.signature,
    stake: this.minStake.mul(2),
  };

  await liquidToken
    .connect(this.signers.system)
    .initialize(
      "Liquidity Token",
      "LQT",
      this.signers.governance.address,
      hydraStaking.address,
      hydraDelegation.address
    );

  const prices: number[] = [];
  for (let i = 0; i < SLOW_SMA - 1; i++) {
    // Generate a random number between 300 and 600
    const randomPrice = Math.floor(Math.random() * (600 - 300 + 1)) + 300;
    prices.push(randomPrice);
  }
  prices.push(INITIAL_PRICE);

  await aprCalculator
    .connect(this.signers.system)
    .initialize(this.signers.governance.address, hydraChain.address, priceOracle.address, prices);

  await systemHydraChain.initialize(
    [validatorInit],
    this.signers.governance.address,
    hydraStaking.address,
    hydraDelegation.address,
    rewardWallet.address,
    DAOIncentiveVault.address,
    bls.address
  );

  await hydraStaking
    .connect(this.signers.system)
    .initialize(
      [validatorInit],
      this.minStake,
      this.signers.governance.address,
      aprCalculator.address,
      hydraChain.address,
      hydraDelegation.address,
      rewardWallet.address,
      liquidToken.address
    );

  await hydraDelegation
    .connect(this.signers.system)
    .initialize(
      [validatorInit],
      INITIAL_COMMISSION,
      this.signers.governance.address,
      aprCalculator.address,
      hydraChain.address,
      hydraStaking.address,
      vestingManagerFactory.address,
      rewardWallet.address,
      liquidToken.address
    );

  await vestingManagerFactory.connect(this.signers.system).initialize(hydraDelegation.address, liquidToken.address);

  await priceOracle.connect(this.signers.system).initialize(hydraChain.address, aprCalculator.address);

  await rewardWallet
    .connect(this.signers.system)
    .initialize([hydraChain.address, hydraStaking.address, hydraDelegation.address]);

  await rewardWallet.fund({
    value: this.minStake.mul(5),
  });

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    validatorInit,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
    DAOIncentiveVault,
  };
}

async function initializedWithSpecificBonusesStateFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    liquidToken,
    aprCalculator,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
    DAOIncentiveVault,
  } = await loadFixture(this.fixtures.presetHydraChainStateFixture);

  await mcl.init();
  const validatorBls = generateValidatorBls(this.signers.admin);
  const validatorInit = {
    addr: this.signers.admin.address,
    pubkey: validatorBls.pubkey,
    signature: validatorBls.signature,
    stake: this.minStake.mul(2),
  };

  await liquidToken
    .connect(this.signers.system)
    .initialize(
      "Liquidity Token",
      "LQT",
      this.signers.governance.address,
      hydraStaking.address,
      hydraDelegation.address
    );

  await aprCalculator
    .connect(this.signers.system)
    .initialize(
      this.signers.governance.address,
      hydraChain.address,
      priceOracle.address,
      INITIAL_PRICES_TO_REACH_BONUSES
    );

  await systemHydraChain.initialize(
    [validatorInit],
    this.signers.governance.address,
    hydraStaking.address,
    hydraDelegation.address,
    rewardWallet.address,
    DAOIncentiveVault.address,
    bls.address
  );

  await hydraStaking
    .connect(this.signers.system)
    .initialize(
      [validatorInit],
      this.minStake,
      this.signers.governance.address,
      aprCalculator.address,
      hydraChain.address,
      hydraDelegation.address,
      rewardWallet.address,
      liquidToken.address
    );

  await hydraDelegation
    .connect(this.signers.system)
    .initialize(
      [validatorInit],
      INITIAL_COMMISSION,
      this.signers.governance.address,
      aprCalculator.address,
      hydraChain.address,
      hydraStaking.address,
      vestingManagerFactory.address,
      rewardWallet.address,
      liquidToken.address
    );

  await vestingManagerFactory.connect(this.signers.system).initialize(hydraDelegation.address, liquidToken.address);

  await priceOracle.connect(this.signers.system).initialize(hydraChain.address, aprCalculator.address);

  await rewardWallet
    .connect(this.signers.system)
    .initialize([hydraChain.address, hydraStaking.address, hydraDelegation.address]);

  await rewardWallet.fund({
    value: this.minStake.mul(500),
  });

  // Check if the bonuses are set correctly
  expect(await aprCalculator.getBaseAPR()).to.be.equal(500);
  expect(await aprCalculator.getMacroFactor()).to.be.equal(2500);
  expect(await aprCalculator.getRSIBonus()).to.be.equal(11500);

  // Disable whitelisting
  await hydraChain.connect(this.signers.governance).disableWhitelisting();
  expect(await hydraChain.isWhitelistingEnabled()).to.be.false;

  // Commit epoch
  const epochId = hre.ethers.BigNumber.from(1);
  const epoch = {
    startBlock: hre.ethers.BigNumber.from(1),
    endBlock: hre.ethers.BigNumber.from(500),
    epochRoot: this.epoch.epochRoot,
  };
  const uptime = [
    {
      validator: this.signers.admin.address,
      signedBlocks: hre.ethers.BigNumber.from(10),
    },
  ];
  await systemHydraChain.commitEpoch(epochId, epoch, 500, uptime);
  await hydraStaking.connect(this.signers.system).distributeRewardsFor(epochId, uptime);

  // register validators
  await registerValidator(hydraChain, this.signers.validators[0], 10);
  await registerValidator(hydraChain, this.signers.validators[1], 10);
  await registerValidator(hydraChain, this.signers.validators[2], 10);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    validatorInit,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
    DAOIncentiveVault,
    validator1: this.signers.validators[0],
    validator2: this.signers.validators[1],
    validator3: this.signers.validators[2],
  };
}

// --------------- Epoch Fixtures ---------------

async function commitEpochTxFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
    DAOIncentiveVault,
  } = await loadFixture(this.fixtures.initializedHydraChainStateFixture);

  const epochId = hre.ethers.BigNumber.from(1);
  const epoch = {
    startBlock: hre.ethers.BigNumber.from(1),
    endBlock: hre.ethers.BigNumber.from(64),
    epochRoot: this.epoch.epochRoot,
  };
  const uptime = [
    {
      validator: this.signers.validators[0].address,
      signedBlocks: hre.ethers.BigNumber.from(10),
    },
  ];
  const commitEpochTx = await systemHydraChain.commitEpoch(epochId, epoch, this.epochSize, uptime);
  await hydraStaking.connect(this.signers.system).distributeRewardsFor(epochId, uptime);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    commitEpochTx,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
    DAOIncentiveVault,
  };
}

async function distributeVaultFundsFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    vestingManagerFactory,
    rewardWallet,
    DAOIncentiveVault,
  } = await loadFixture(this.fixtures.commitEpochTxFixture);

  const distributeVaultFundsTx = await hydraChain.connect(this.signers.system).distributeDAOIncentive();

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    distributeVaultFundsTx,
    vestingManagerFactory,
    rewardWallet,
    DAOIncentiveVault,
  };
}

async function rsiOverSoldConditionFixtureFunction(this: Mocha.Context) {
  const { hydraChain, systemHydraChain, bls, hydraStaking, hydraDelegation, liquidToken, aprCalculator, priceOracle } =
    await loadFixture(this.fixtures.validatorsDataStateFixture);

  // set the correct voting time
  const correctVotingTime = getCorrectVotingTimestamp();

  await time.setNextBlockTimestamp(correctVotingTime);

  for (let i = 0; i !== 15; i++) {
    for (let j = 0; j !== 3; j++) {
      await priceOracle.connect(this.signers.validators[j]).vote(INITIAL_PRICE - i * 35);
    }
    await commitEpoch(systemHydraChain, hydraStaking, [this.signers.validators[1]], this.epochSize, DAY);
  }

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    priceOracle,
  };
}
// --------------- Validators Fixtures ---------------

async function whitelistedValidatorsStateFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
  } = await loadFixture(this.fixtures.commitEpochTxFixture);

  await hydraChain
    .connect(this.signers.governance)
    .addToWhitelist([
      this.signers.validators[0].address,
      this.signers.validators[1].address,
      this.signers.validators[2].address,
      this.signers.validators[3].address,
    ]);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
  };
}

async function registeredValidatorsStateFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
  } = await loadFixture(this.fixtures.whitelistedValidatorsStateFixture);

  await registerValidator(hydraChain, this.signers.validators[0], 0);
  await registerValidator(hydraChain, this.signers.validators[1], 0);
  await registerValidator(hydraChain, this.signers.validators[2], 0);
  await registerValidator(hydraChain, this.signers.validators[3], 0);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
  };
}

async function validatorsDataStateFixtureFunction(this: Mocha.Context) {
  const { hydraChain, systemHydraChain, bls, hydraStaking, hydraDelegation, liquidToken, aprCalculator, priceOracle } =
    await loadFixture(this.fixtures.stakedValidatorsStateFixture);

  await hydraStaking.connect(this.signers.validators[2]).stake({ value: this.minStake.mul(2) });
  await hydraStaking.connect(this.signers.validators[3]).stake({ value: this.minStake.mul(2) });

  const validatorsData = [
    { validator: this.signers.validators[0].address, votingPower: 24 },
    { validator: this.signers.validators[1].address, votingPower: 18 },
    { validator: this.signers.validators[2].address, votingPower: 22 },
    { validator: this.signers.validators[3].address, votingPower: 26 },
  ];
  await hydraChain.connect(this.signers.system).syncValidatorsData(validatorsData);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    priceOracle,
  };
}

async function votedValidatorsStateFixtureFunction(this: Mocha.Context) {
  const { hydraChain, systemHydraChain, bls, hydraStaking, hydraDelegation, liquidToken, aprCalculator, priceOracle } =
    await loadFixture(this.fixtures.validatorsDataStateFixture);

  // set the correct voting time
  const correctVotingTime = getCorrectVotingTimestamp();

  await time.setNextBlockTimestamp(correctVotingTime);

  const priceToVote = INITIAL_PRICE * 2;
  await priceOracle.connect(this.signers.validators[0]).vote(priceToVote);
  await priceOracle.connect(this.signers.validators[1]).vote(priceToVote);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    priceOracle,
    priceToVote,
    validatorToVote: this.signers.validators[3],
  };
}

async function validatorToBanFixtureFunction(this: Mocha.Context) {
  const { hydraChain, systemHydraChain, hydraStaking, hydraDelegation } = await loadFixture(
    this.fixtures.stakedValidatorsStateFixture
  );

  const validator = this.signers.validators[0];

  // commit some epochs, including the selected validator
  await commitEpochs(
    systemHydraChain,
    hydraStaking,
    [validator, this.signers.validators[1], this.signers.validators[2]],
    3, // number of epochs to commit
    this.epochSize
  );

  // lower the threshold in order to easily reach it
  const banThreshold = hre.ethers.BigNumber.from(100);
  const hydraChainGov = hydraChain.connect(this.signers.governance);
  await hydraChainGov.setInitiateBanThreshold(banThreshold);

  // commit epochs, but without the validator that will be banned
  await commitEpochs(
    systemHydraChain,
    hydraStaking,
    [this.signers.validators[1], this.signers.validators[2]],
    10, // number of epochs to commit
    this.epochSize
  );

  // lower the reporter reward in order to be able to distribute it
  const reporterReward = this.minStake.div(10);
  await hydraChainGov.setReporterReward(reporterReward);
  // lower the penalty in order to be able to penalize
  await hydraChainGov.setValidatorPenalty(reporterReward.mul(2));

  return {
    hydraChain,
    hydraStaking,
    hydraDelegation,
    validatorToBan: validator,
  };
}

async function banInitiatedFixtureFunction(this: Mocha.Context) {
  const { hydraChain, hydraStaking, validatorToBan, hydraDelegation } = await loadFixture(
    this.fixtures.validatorToBanFixture
  );

  await hydraChain.initiateBan(validatorToBan.address);

  return {
    hydraChain,
    hydraStaking,
    hydraDelegation,
    inBanProcessValidator: validatorToBan,
  };
}

async function bannedValidatorFixtureFunction(this: Mocha.Context) {
  const { hydraChain, hydraStaking, liquidToken } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

  await hydraChain.connect(this.signers.governance).setValidatorPenalty(this.minStake.div(10));

  const validator = this.signers.validators[0];
  const stakedAmount = await hydraStaking.stakeOf(validator.address);

  await hydraChain.connect(this.signers.governance).banValidator(validator.address);

  return {
    hydraChain,
    hydraStaking,
    liquidToken,
    bannedValidator: validator,
    stakedAmount,
  };
}

// --------------- Staking Fixtures ---------------

async function stakedValidatorsStateFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
  } = await loadFixture(this.fixtures.registeredValidatorsStateFixture);

  // set the rsi to the minimum value
  await hydraStaking.connect(this.signers.validators[0]).stake({ value: this.minStake.mul(2) });
  await hydraStaking.connect(this.signers.validators[1]).stake({ value: this.minStake.mul(2) });

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    vestingManagerFactory,
    priceOracle,
    rewardWallet,
  };
}

async function newVestingValidatorFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraDelegation,
    hydraStaking,
    aprCalculator,
    liquidToken,
    vestingManagerFactory,
    rewardWallet,
  } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

  const staker = this.signers.accounts[9];
  await hydraChain.connect(this.signers.governance).addToWhitelist([staker.address]);
  await registerValidator(hydraChain, staker, 0);

  const stakerHydraStaking = hydraStaking.connect(staker);
  await stakerHydraStaking.stakeWithVesting(VESTING_DURATION_WEEKS, {
    value: this.minStake.mul(2),
  });

  // commit epoch so the balance is increased
  await commitEpochs(
    systemHydraChain,
    hydraStaking,
    [this.signers.validators[0], this.signers.validators[1], staker],
    1, // number of epochs to commit
    this.epochSize
  );

  return {
    stakerHydraStaking,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    aprCalculator,
    vestingManagerFactory,
    rewardWallet,
  };
}

// --------------- Withdrawable Fixtures ---------------

async function withdrawableFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    aprCalculator,
    rewardWallet,
  } = await loadFixture(this.fixtures.stakedValidatorsStateFixture);

  const unstakedValidator = this.signers.validators[0];
  const unstakedAmount = this.minStake.div(2);
  await hydraStaking.connect(unstakedValidator).unstake(unstakedAmount);

  await commitEpochs(
    systemHydraChain,
    hydraStaking,
    [unstakedValidator, this.signers.validators[1], this.signers.validators[2]],
    3, // number of epochs to commit
    this.epochSize
  );
  // * stake for the third validator after a week
  await time.increase(WEEK);
  await hydraStaking.connect(this.signers.validators[2]).stake({ value: this.minStake.mul(2) });

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    unstakedValidator,
    unstakedAmount,
    vestingManagerFactory,
    aprCalculator,
    rewardWallet,
  };
}

// --------------- Delegated Fixtures ---------------

async function delegatedFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    aprCalculator,
    rewardWallet,
  } = await loadFixture(this.fixtures.withdrawableFixture);

  const delegateAmount = this.minDelegation.mul(2);

  await hydraDelegation.connect(this.signers.delegator).delegate(this.signers.validators[0].address, {
    value: delegateAmount,
  });

  await commitEpochs(
    systemHydraChain,
    hydraStaking,
    [this.signers.validators[0], this.signers.validators[1], this.signers.validators[2]],
    3, // number of epochs to commit
    this.epochSize
  );

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    aprCalculator,
    rewardWallet,
  };
}

async function vestManagerFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    aprCalculator,
    rewardWallet,
  } = await loadFixture(this.fixtures.delegatedFixture);

  const { newManagerFactory, newManager } = await createNewVestManager(vestingManagerFactory, this.signers.accounts[4]);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestManager: newManager,
    vestManagerOwner: this.signers.accounts[4],
    vestingManagerFactory: newManagerFactory,
    aprCalculator,
    rewardWallet,
  };
}

async function vestedDelegationFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    vestManager,
    vestManagerOwner,
    rewardWallet,
  } = await loadFixture(this.fixtures.vestManagerFixture);

  const validator = this.signers.validators[2];
  await vestManager.openVestedDelegatePosition(validator.address, VESTING_DURATION_WEEKS, {
    value: this.minDelegation.mul(2),
  });

  // Commit epochs so rewards to be distributed
  await commitEpochs(
    systemHydraChain,
    hydraStaking,
    [this.signers.validators[0], this.signers.validators[1], validator],
    3, // number of epochs to commit
    this.epochSize
  );

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    vestManager,
    vestManagerOwner,
    delegatedValidator: validator,
    rewardWallet,
  };
}

async function weeklyVestedDelegationFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    vestManager,
    vestManagerOwner,
    aprCalculator,
    rewardWallet,
  } = await loadFixture(this.fixtures.vestManagerFixture);

  const validator = this.signers.validators[2];
  const vestingDuration = 1; // 1 week
  await vestManager.openVestedDelegatePosition(validator.address, vestingDuration, {
    value: this.minDelegation.mul(2),
  });

  // Commit epochs so rewards to be distributed
  await commitEpochs(
    systemHydraChain,
    hydraStaking,
    [this.signers.validators[0], this.signers.validators[1], validator],
    5, // number of epochs to commit
    this.epochSize
  );

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    vestManager,
    vestManagerOwner,
    delegatedValidator: validator,
    aprCalculator,
    rewardWallet,
  };
}

async function swappedPositionFixtureFunction(this: Mocha.Context) {
  const {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    vestManager,
    vestManagerOwner,
  } = await loadFixture(this.fixtures.vestManagerFixture);

  const validator = this.signers.validators[0];
  const newValidator = this.signers.validators[1];

  const vestingDuration = 2; // 2 weeks
  await vestManager.connect(vestManagerOwner).openVestedDelegatePosition(validator.address, vestingDuration, {
    value: this.minDelegation.mul(2),
  });

  await commitEpoch(systemHydraChain, hydraStaking, [validator, newValidator], this.epochSize);

  const rewardsBeforeSwap = await hydraDelegation.getRawReward(validator.address, vestManager.address);

  // swap
  await vestManager.connect(vestManagerOwner).swapVestedPositionStaker(validator.address, newValidator.address);

  return {
    hydraChain,
    systemHydraChain,
    bls,
    hydraStaking,
    hydraDelegation,
    liquidToken,
    vestingManagerFactory,
    vestManager,
    vestManagerOwner,
    oldValidator: validator,
    newValidator,
    rewardsBeforeSwap,
  };
}

export async function generateFixtures(context: Mocha.Context) {
  context.fixtures.presetHydraChainStateFixture = presetHydraChainStateFixtureFunction.bind(context);
  context.fixtures.initializedHydraChainStateFixture = initializedHydraChainStateFixtureFunction.bind(context);
  context.fixtures.initializedWithSpecificBonusesStateFixture =
    initializedWithSpecificBonusesStateFixtureFunction.bind(context);
  context.fixtures.commitEpochTxFixture = commitEpochTxFixtureFunction.bind(context);
  context.fixtures.distributeVaultFundsFixture = distributeVaultFundsFixtureFunction.bind(context);
  context.fixtures.rsiOverSoldConditionFixture = rsiOverSoldConditionFixtureFunction.bind(context);
  context.fixtures.whitelistedValidatorsStateFixture = whitelistedValidatorsStateFixtureFunction.bind(context);
  context.fixtures.registeredValidatorsStateFixture = registeredValidatorsStateFixtureFunction.bind(context);
  context.fixtures.validatorsDataStateFixture = validatorsDataStateFixtureFunction.bind(context);
  context.fixtures.votedValidatorsStateFixture = votedValidatorsStateFixtureFunction.bind(context);
  context.fixtures.stakedValidatorsStateFixture = stakedValidatorsStateFixtureFunction.bind(context);
  context.fixtures.newVestingValidatorFixture = newVestingValidatorFixtureFunction.bind(context);
  context.fixtures.withdrawableFixture = withdrawableFixtureFunction.bind(context);
  context.fixtures.delegatedFixture = delegatedFixtureFunction.bind(context);
  context.fixtures.vestManagerFixture = vestManagerFixtureFunction.bind(context);
  context.fixtures.vestedDelegationFixture = vestedDelegationFixtureFunction.bind(context);
  context.fixtures.weeklyVestedDelegationFixture = weeklyVestedDelegationFixtureFunction.bind(context);
  context.fixtures.validatorToBanFixture = validatorToBanFixtureFunction.bind(context);
  context.fixtures.banInitiatedFixtureFunction = banInitiatedFixtureFunction.bind(context);
  context.fixtures.bannedValidatorFixture = bannedValidatorFixtureFunction.bind(context);
  context.fixtures.swappedPositionFixture = swappedPositionFixtureFunction.bind(context);
}
