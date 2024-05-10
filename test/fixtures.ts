/* eslint-disable node/no-extraneous-import */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";

import * as mcl from "../ts/mcl";
import {
  System__factory,
  BLS__factory,
  LiquidityToken__factory,
  RewardPool__factory,
  ValidatorSet__factory,
} from "../typechain-types";
import { CHAIN_ID, DOMAIN, INITIAL_COMMISSION, MIN_RSI_BONUS, SYSTEM, VESTING_DURATION_WEEKS, WEEK } from "./constants";
import {
  getMaxEpochReward,
  commitEpochs,
  registerValidator,
  createNewVestManager,
  generateValidatorBls,
} from "./helper";

async function systemFixtureFunction(this: Mocha.Context) {
  const SystemFactory = new System__factory(this.signers.admin);
  const system = await SystemFactory.deploy();

  return system;
}

async function presetValidatorSetStateFixtureFunction(this: Mocha.Context) {
  const ValidatorSetFactory = new ValidatorSet__factory(this.signers.admin);
  const validatorSet = await ValidatorSetFactory.deploy();

  await hre.network.provider.send("hardhat_setBalance", [SYSTEM, "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"]);

  // TODO: remove this once we have a better way to set balance from Polygon
  // Need otherwise burn mechanism doesn't work
  await hre.network.provider.send("hardhat_setBalance", [
    validatorSet.address,
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

  const systemValidatorSet = validatorSet.connect(this.signers.system);
  const bls = await blsFixtureFunction.bind(this)();
  const rewardPool = await rewardPoolFixtureFunction.bind(this)();
  const liquidToken = await liquidityTokenFixtureFunction.bind(this)();

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function initializedValidatorSetStateFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.presetValidatorSetStateFixture
  );

  await mcl.init();
  const validatorBls = generateValidatorBls(this.signers.admin);
  const validatorInit = {
    addr: this.signers.admin.address,
    pubkey: validatorBls.pubkey,
    signature: validatorBls.signature,
    stake: this.minStake.mul(2),
  };

  const systemRewardPool = rewardPool.connect(this.signers.system);
  await systemRewardPool.initialize(
    validatorSet.address,
    this.signers.rewardWallet.address,
    this.minDelegation,
    this.signers.governance.address
  );
  await liquidToken.initialize("Liquidity Token", "LQT", this.signers.governance.address, systemValidatorSet.address);
  await systemValidatorSet.initialize(
    {
      epochReward: this.epochReward,
      minStake: this.minStake,
      epochSize: this.epochSize,
    },
    [validatorInit],
    bls.address,
    rewardPool.address,
    this.signers.governance.address,
    liquidToken.address,
    INITIAL_COMMISSION
  );

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function commitEpochTxFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.initializedValidatorSetStateFixture
  );

  const epochId = hre.ethers.BigNumber.from(1);
  const epoch = {
    startBlock: hre.ethers.BigNumber.from(1),
    endBlock: hre.ethers.BigNumber.from(64),
    epochRoot: this.epoch.epochRoot,
  };
  const commitEpochTx = await systemValidatorSet.commitEpoch(epochId, epoch, this.epochSize);
  const uptime = [
    {
      validator: this.signers.validators[0].address,
      signedBlocks: hre.ethers.BigNumber.from(10),
    },
  ];
  const maxReward = await getMaxEpochReward(systemValidatorSet);
  await rewardPool.connect(this.signers.system).distributeRewardsFor(epochId, uptime, this.epochSize, {
    value: maxReward,
  });

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken, commitEpochTx };
}

async function whitelistedValidatorsStateFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.commitEpochTxFixture
  );

  await validatorSet
    .connect(this.signers.governance)
    .addToWhitelist([
      this.signers.validators[0].address,
      this.signers.validators[1].address,
      this.signers.validators[2].address,
      this.signers.validators[3].address,
    ]);

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function registeredValidatorsStateFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.whitelistedValidatorsStateFixture
  );

  const keyPair = mcl.newKeyPair();
  const validator1signature = mcl.signValidatorMessage(
    DOMAIN,
    CHAIN_ID,
    this.signers.validators[0].address,
    keyPair.secret
  ).signature;

  const validator2signature = mcl.signValidatorMessage(
    DOMAIN,
    CHAIN_ID,
    this.signers.validators[1].address,
    keyPair.secret
  ).signature;

  const validator3signature = mcl.signValidatorMessage(
    DOMAIN,
    CHAIN_ID,
    this.signers.validators[2].address,
    keyPair.secret
  ).signature;

  await validatorSet
    .connect(this.signers.validators[0])
    .register(mcl.g1ToHex(validator1signature), mcl.g2ToHex(keyPair.pubkey), INITIAL_COMMISSION);
  await validatorSet
    .connect(this.signers.validators[1])
    .register(mcl.g1ToHex(validator2signature), mcl.g2ToHex(keyPair.pubkey), INITIAL_COMMISSION);
  await validatorSet
    .connect(this.signers.validators[2])
    .register(mcl.g1ToHex(validator3signature), mcl.g2ToHex(keyPair.pubkey), INITIAL_COMMISSION);

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function stakedValidatorsStateFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.registeredValidatorsStateFixture
  );

  // set the rsi to the minimum value
  await rewardPool.connect(this.signers.governance).setRSI(MIN_RSI_BONUS);
  await validatorSet.connect(this.signers.validators[0]).stake({ value: this.minStake.mul(2) });
  await validatorSet.connect(this.signers.validators[1]).stake({ value: this.minStake.mul(2) });

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function newVestingValidatorFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.stakedValidatorsStateFixture
  );

  const staker = this.signers.accounts[9];
  await registerValidator(validatorSet, this.signers.governance, staker);

  const stakerValidatorSet = validatorSet.connect(staker);
  await stakerValidatorSet.stakeWithVesting(VESTING_DURATION_WEEKS, {
    value: this.minStake,
  });

  // commit epoch so the balance is increased
  await commitEpochs(
    systemValidatorSet,
    rewardPool,
    [this.signers.validators[0], this.signers.validators[1], staker],
    1, // number of epochs to commit
    this.epochSize
  );

  return { stakerValidatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function vestingRewardsFixtureFunction(this: Mocha.Context) {
  const { stakerValidatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.newVestingValidatorFixture
  );

  const staker = this.signers.accounts[9];

  await commitEpochs(
    systemValidatorSet,
    rewardPool,
    [this.signers.validators[0], this.signers.validators[1], staker],
    1, // number of epochs to commit
    this.epochSize
  );

  await stakerValidatorSet.stake({ value: this.minStake });

  await commitEpochs(
    systemValidatorSet,
    rewardPool,
    [this.signers.validators[0], this.signers.validators[1], staker],
    1, // number of epochs to commit
    this.epochSize
  );

  return { stakerValidatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function withdrawableFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.stakedValidatorsStateFixture
  );

  await validatorSet.connect(this.signers.validators[0]).unstake(this.minStake.div(2));
  await time.increase(WEEK);

  // * stake for the third validator after a week
  await validatorSet.connect(this.signers.validators[2]).stake({ value: this.minStake.mul(2) });

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function delegatedFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.withdrawableFixture
  );

  const delegateAmount = this.minDelegation.mul(2);

  await validatorSet.connect(this.signers.delegator).delegate(this.signers.validators[0].address, {
    value: delegateAmount,
  });

  await commitEpochs(
    systemValidatorSet,
    rewardPool,
    [this.signers.validators[0], this.signers.validators[1], this.signers.validators[2]],
    3, // number of epochs to commit
    this.epochSize
  );

  return { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken };
}

async function vestManagerFixtureFunction(this: Mocha.Context) {
  const { validatorSet, systemValidatorSet, bls, rewardPool, liquidToken } = await loadFixture(
    this.fixtures.delegatedFixture
  );

  const { newManagerFactory, newManager } = await createNewVestManager(
    validatorSet,
    rewardPool,
    this.signers.accounts[4]
  );

  return {
    validatorSet,
    systemValidatorSet,
    bls,
    rewardPool,
    liquidToken,
    VestManagerFactory: newManagerFactory,
    vestManager: newManager,
    vestManagerOwner: this.signers.accounts[4],
  };
}

async function vestedDelegationFixtureFunction(this: Mocha.Context) {
  const {
    validatorSet,
    systemValidatorSet,
    bls,
    rewardPool,
    liquidToken,
    VestManagerFactory,
    vestManager,
    vestManagerOwner,
  } = await loadFixture(this.fixtures.vestManagerFixture);

  const validator = this.signers.validators[2];
  await vestManager.openVestedDelegatePosition(validator.address, VESTING_DURATION_WEEKS, {
    value: this.minDelegation.mul(2),
  });

  // Commit epochs so rewards to be distributed
  await commitEpochs(
    systemValidatorSet,
    rewardPool,
    [this.signers.validators[0], this.signers.validators[1], validator],
    3, // number of epochs to commit
    this.epochSize
  );

  return {
    validatorSet,
    systemValidatorSet,
    bls,
    rewardPool,
    liquidToken,
    VestManagerFactory,
    vestManager,
    vestManagerOwner,
    delegatedValidator: validator,
  };
}

async function weeklyVestedDelegationFixtureFunction(this: Mocha.Context) {
  const {
    validatorSet,
    systemValidatorSet,
    bls,
    rewardPool,
    liquidToken,
    VestManagerFactory,
    vestManager,
    vestManagerOwner,
  } = await loadFixture(this.fixtures.vestManagerFixture);

  const validator = this.signers.validators[2];
  const vestingDuration = 1; // 1 week
  await vestManager.openVestedDelegatePosition(validator.address, vestingDuration, {
    value: this.minDelegation.mul(2),
  });

  // Commit epochs so rewards to be distributed
  await commitEpochs(
    systemValidatorSet,
    rewardPool,
    [this.signers.validators[0], this.signers.validators[1], validator],
    5, // number of epochs to commit
    this.epochSize
  );

  return {
    validatorSet,
    systemValidatorSet,
    bls,
    rewardPool,
    liquidToken,
    VestManagerFactory,
    vestManager,
    vestManagerOwner,
    delegatedValidator: validator,
  };
}

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

async function rewardPoolFixtureFunction(this: Mocha.Context) {
  const RewardPoolFactory = new RewardPool__factory(this.signers.admin);
  const rewardPool = await RewardPoolFactory.deploy();

  return rewardPool;
}

export async function generateFixtures(context: Mocha.Context) {
  context.fixtures.systemFixture = systemFixtureFunction.bind(context);
  context.fixtures.presetValidatorSetStateFixture = presetValidatorSetStateFixtureFunction.bind(context);
  context.fixtures.initializedValidatorSetStateFixture = initializedValidatorSetStateFixtureFunction.bind(context);
  context.fixtures.commitEpochTxFixture = commitEpochTxFixtureFunction.bind(context);
  context.fixtures.whitelistedValidatorsStateFixture = whitelistedValidatorsStateFixtureFunction.bind(context);
  context.fixtures.registeredValidatorsStateFixture = registeredValidatorsStateFixtureFunction.bind(context);
  context.fixtures.stakedValidatorsStateFixture = stakedValidatorsStateFixtureFunction.bind(context);
  context.fixtures.newVestingValidatorFixture = newVestingValidatorFixtureFunction.bind(context);
  context.fixtures.vestingRewardsFixture = vestingRewardsFixtureFunction.bind(context);
  context.fixtures.withdrawableFixture = withdrawableFixtureFunction.bind(context);
  context.fixtures.delegatedFixture = delegatedFixtureFunction.bind(context);
  context.fixtures.vestManagerFixture = vestManagerFixtureFunction.bind(context);
  context.fixtures.vestedDelegationFixture = vestedDelegationFixtureFunction.bind(context);
  context.fixtures.weeklyVestedDelegationFixture = weeklyVestedDelegationFixtureFunction.bind(context);
}
