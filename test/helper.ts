/* eslint-disable camelcase */
/* eslint-disable node/no-extraneous-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";
import { BigNumber, ContractTransaction } from "ethers";

import * as mcl from "../ts/mcl";
import { Fixtures, Signers } from "./mochaContext";
import { ValidatorSet } from "../typechain-types/contracts/ValidatorSet";
import { RewardPool } from "../typechain-types/contracts/RewardPool";
import { VestManager } from "../typechain-types/contracts/ValidatorSet/modules/Delegation";
import { VestManager__factory } from "../typechain-types/factories/contracts/ValidatorSet/modules/Delegation";
import { CHAIN_ID, DAY, DENOMINATOR, DOMAIN, EPOCHS_YEAR, INITIAL_COMMISSION, SYSTEM, WEEK } from "./constants";

interface RewardParams {
  timestamp: BigNumber;
}

// * Method used to initialize the parameters of the mocha context, e.g., the signers
export async function initializeContext(context: any) {
  context.signers = {} as Signers;
  context.fixtures = {} as Fixtures;

  const signers = await hre.ethers.getSigners();
  context.signers.accounts = signers;
  context.signers.admin = signers[0];
  context.signers.validators = initValidators(signers, 1, 4);
  context.signers.governance = signers[5];
  context.signers.delegator = signers[6];
  context.signers.rewardWallet = signers[7];
  context.signers.system = await hre.ethers.getSigner(SYSTEM);
  context.epochId = hre.ethers.BigNumber.from(1);
  context.epochSize = hre.ethers.BigNumber.from(64);
  context.epochReward = hre.ethers.utils.parseEther("0.0000001");
  context.minStake = hre.ethers.utils.parseEther("1");
  context.minDelegation = hre.ethers.utils.parseEther("1");
  context.epochsInYear = 31500;
  context.epoch = {
    startBlock: hre.ethers.BigNumber.from(1),
    endBlock: hre.ethers.BigNumber.from(64),
    epochRoot: hre.ethers.utils.randomBytes(32),
  };
  context.uptime = [
    {
      validator: context.signers.validators[0].address,
      signedBlocks: hre.ethers.BigNumber.from(0),
    },
  ];

  const network = await hre.ethers.getDefaultProvider().getNetwork();
  context.chainId = network.chainId;
}

export async function getMaxEpochReward(validatorSet: ValidatorSet) {
  const totalStake = await validatorSet.totalSupply();
  return totalStake;
}

export async function commitEpoch(
  systemValidatorSet: ValidatorSet,
  rewardPool: RewardPool,
  validators: SignerWithAddress[],
  epochSize: BigNumber,
  increaseTime?: number
): Promise<{ commitEpochTx: ContractTransaction; distributeRewardsTx: ContractTransaction }> {
  const currEpochId = await systemValidatorSet.currentEpochId();
  const prevEpochId = currEpochId.sub(1);
  const previousEpoch = await systemValidatorSet.epochs(prevEpochId);
  const newEpoch = {
    startBlock: previousEpoch.endBlock.add(1),
    endBlock: previousEpoch.endBlock.add(epochSize),
    epochRoot: hre.ethers.utils.randomBytes(32),
  };

  const validatorsUptime = [];
  for (const validator of validators) {
    validatorsUptime.push({ validator: validator.address, signedBlocks: 64 });
  }

  await mine(epochSize, { interval: 2 });
  increaseTime = increaseTime || DAY; // default 1 day
  await time.increase(increaseTime);

  const commitEpochTx = await systemValidatorSet.commitEpoch(currEpochId, newEpoch, epochSize);

  const maxReward = await getMaxEpochReward(systemValidatorSet);
  const distributeRewardsTx = await rewardPool
    .connect(systemValidatorSet.signer)
    .distributeRewardsFor(currEpochId, validatorsUptime, epochSize, {
      value: maxReward,
    });

  return { commitEpochTx, distributeRewardsTx };
}

export async function commitEpochs(
  systemValidatorSet: ValidatorSet,
  rewardPool: RewardPool,
  validators: SignerWithAddress[],
  numOfEpochsToCommit: number,
  epochSize: BigNumber,
  increaseTime?: number
) {
  if (epochSize.isZero() || numOfEpochsToCommit === 0) return;

  for (let i = 0; i < numOfEpochsToCommit; i++) {
    await commitEpoch(systemValidatorSet, rewardPool, validators, epochSize, increaseTime);
  }
}

export function initValidators(accounts: SignerWithAddress[], from: number = 0, to: number = 4) {
  if (to > accounts.length) {
    throw new Error("Too many validators");
  }

  const validators: SignerWithAddress[] = [];
  for (let i = from; i <= to; i++) {
    validators.push(accounts[i]);
  }

  return validators;
}

export async function registerValidator(validatorSet: ValidatorSet, account: any) {
  const keyPair = mcl.newKeyPair();
  const signature = mcl.signValidatorMessage(DOMAIN, CHAIN_ID, account.address, keyPair.secret).signature;

  const tx = await validatorSet
    .connect(account)
    .register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey), INITIAL_COMMISSION);
  const txReceipt = await tx.wait();

  if (txReceipt.status !== 1) {
    throw new Error("Cannot register address");
  }
}

export async function getValidatorReward(validatorSet: ValidatorSet, validatorAddr: string) {
  const validator = await validatorSet.getValidator(validatorAddr);

  return validator.withdrawableRewards;
}

export function findProperRPSIndex<T extends RewardParams>(arr: T[], timestamp: BigNumber): number {
  let left = 0;
  let right = arr.length - 1;
  let closestTimestamp: null | BigNumber = null;
  let closestIndex: null | number = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid].timestamp;

    if (midValue.eq(timestamp)) {
      // Timestamp found
      return mid;
    } else if (midValue.lt(timestamp)) {
      // Check if the timestamp is closer to the mid
      if (closestTimestamp === null || timestamp.sub(midValue).abs().lt(timestamp.sub(closestTimestamp).abs())) {
        closestTimestamp = midValue;
        closestIndex = mid;
      }
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (closestIndex === null) {
    throw new Error("Invalid timestamp");
  }

  return closestIndex;
}

export function findTopUpIndex(arr: any[], epochNum: BigNumber): number {
  if (arr.length <= 1) return 0;

  let left = 0;
  let right = arr.length - 1;
  let closestEpoch: null | BigNumber = null;
  let closestIndex: null | number = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid].epochNum;
    if (midValue.eq(epochNum)) {
      // Timestamp found
      return mid;
    } else if (midValue.lt(epochNum)) {
      // Check if the timestamp is closer to the mid
      if (closestEpoch === null || epochNum.sub(midValue).abs().lt(epochNum.sub(closestEpoch).abs())) {
        closestEpoch = midValue;
        closestIndex = mid;
      }
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (closestIndex === null) {
    throw new Error("findTopUpIndex: Invalid epoch number");
  }

  return closestIndex;
}

export async function calculatePenalty(position: any, timestamp: BigNumber, amount: BigNumber) {
  const leftPeriod: BigNumber = position.end.sub(timestamp);
  let leftWeeks = leftPeriod.mod(WEEK); // get the remainder first
  if (leftWeeks.isZero()) {
    // if no remainder, then get the exact weeks
    leftWeeks = leftPeriod.div(WEEK);
  } else {
    // if there is remainder, then week is not passed => increase by 1
    leftWeeks = leftPeriod.div(WEEK).add(1);
  }

  // basis points used for precise percentage calculations
  const bps = leftWeeks.mul(30);
  return amount.mul(bps).div(DENOMINATOR);
}

export async function getUserManager(
  validatorSet: ValidatorSet,
  account: any,
  VestManagerFactory: any
): Promise<VestManager> {
  // Find user vesting position based on the emitted  events
  const filter = validatorSet.filters.NewClone(account.address);
  const positionAddr = (await validatorSet.queryFilter(filter))[0].args.newClone;
  const manager = VestManagerFactory.attach(positionAddr);

  return manager.connect(account);
}

export async function claimPositionRewards(
  validatorSet: ValidatorSet,
  rewardPool: RewardPool,
  vestManager: VestManager,
  validator: string
) {
  const position = await rewardPool.delegationPositions(validator, vestManager.address);
  const currentEpochId = await validatorSet.currentEpochId();
  const rpsValues = await rewardPool.getRPSValues(validator, 0, currentEpochId);
  const rpsIndex = findProperRPSIndex(rpsValues, position.end);
  await vestManager.claimVestedPositionReward(validator, rpsIndex, 0);
}

export async function createNewVestManager(
  validatorSet: ValidatorSet,
  rewardPool: RewardPool,
  owner: SignerWithAddress
) {
  const tx = await validatorSet.connect(owner).newManager(rewardPool.address);
  const receipt = await tx.wait();
  const event = receipt.events?.find((e) => e.event === "NewClone");
  const address = event?.args?.newClone;

  const VestManagerFactory = new VestManager__factory(owner);
  const vestManager: VestManager = VestManagerFactory.attach(address);

  return { newManagerFactory: VestManagerFactory, newManager: vestManager };
}

export async function retrieveRPSData(
  validatorSet: ValidatorSet,
  rewardPool: RewardPool,
  validator: string,
  manager: string
) {
  const position = await rewardPool.delegationPositions(validator, manager);
  const maturedIn = await getClosestMaturedTimestamp(position);
  const currentEpochId = await validatorSet.currentEpochId();
  const rpsValues = await rewardPool.getRPSValues(validator, 0, currentEpochId);
  const epochNum = findProperRPSIndex(rpsValues, hre.ethers.BigNumber.from(maturedIn));
  const delegationPoolParamsHistory = await rewardPool.getDelegationPoolParamsHistory(validator, manager);
  const topUpIndex = findTopUpIndex(delegationPoolParamsHistory, hre.ethers.BigNumber.from(epochNum));

  return { position, epochNum, topUpIndex };
}

export async function calculateExpectedReward(
  base: BigNumber,
  vestBonus: BigNumber,
  rsi: BigNumber,
  reward: BigNumber
) {
  // calculate expected reward based on the given apr factors
  return base.add(vestBonus).mul(rsi).mul(reward).div(DENOMINATOR.mul(DENOMINATOR)).div(EPOCHS_YEAR);
}

export async function applyMaxReward(rewardPool: RewardPool, reward: BigNumber) {
  const base = await rewardPool.base();
  const rsi = await rewardPool.rsi();
  const vestBonus = await rewardPool.getVestingBonus(52);

  // calculate expected reward
  return base.add(vestBonus).mul(rsi).mul(reward).div(DENOMINATOR.mul(DENOMINATOR)).div(EPOCHS_YEAR);
}

export async function applyCustomReward(
  rewardPool: RewardPool,
  validator: string,
  delegator: string,
  reward: BigNumber,
  rsi: boolean
) {
  const position = await rewardPool.delegationPositions(validator, delegator);

  let bonus = position.base.add(position.vestBonus);
  let divider = DENOMINATOR;
  if (rsi && !position.rsiBonus.isZero()) {
    bonus = bonus.mul(position.rsiBonus);
    divider = divider.mul(DENOMINATOR);
  }

  return reward.mul(bonus).div(divider).div(EPOCHS_YEAR);
}

/**
 * Generate BLS pubkey and signature for validator
 * @param account ethersjs signer
 * @returns ValidatorBLS object with pubkey and signature
 */
export function generateValidatorBls(account: SignerWithAddress) {
  const keyPair = mcl.newKeyPair();
  const signature = genValSignature(account, keyPair);

  const bls = {
    pubkey: mcl.g2ToHex(keyPair.pubkey),
    signature: mcl.g1ToHex(signature),
  };

  return bls;
}

export function genValSignature(account: SignerWithAddress, keyPair: mcl.keyPair) {
  return mcl.signValidatorMessage(DOMAIN, CHAIN_ID, account.address, keyPair.secret).signature;
}

export async function createManagerAndVest(
  validatorSet: ValidatorSet,
  rewardPool: RewardPool,
  account: SignerWithAddress,
  validator: string,
  duration: number,
  amount: BigNumber
) {
  const { newManager } = await createNewVestManager(validatorSet, rewardPool, account);

  await newManager.openVestedDelegatePosition(validator, duration, {
    value: amount,
  });

  return newManager;
}

export async function getDelegatorPositionReward(
  validatorSet: ValidatorSet,
  rewardPool: RewardPool,
  validator: string,
  delegator: string
) {
  // prepare params for call
  const { epochNum, topUpIndex } = await retrieveRPSData(validatorSet, rewardPool, validator, delegator);

  return await rewardPool.getDelegatorPositionReward(validator, delegator, epochNum, topUpIndex);
}

export async function getClosestMaturedTimestamp(position: any) {
  let alreadyMatureIn = 0;
  if (await hasMatured(position.end, position.duration)) {
    alreadyMatureIn = position.end;
  } else {
    const currChainTs = await time.latest();
    const maturedPeriod = currChainTs - position.end;
    alreadyMatureIn = position.start.add(maturedPeriod);
  }

  return alreadyMatureIn;
}

// function that returns whether a position is matured or not
async function hasMatured(positionEnd: BigNumber, positionDuration: BigNumber) {
  const currChainTs = await time.latest();

  return positionEnd && positionDuration && positionEnd.add(positionDuration).lte(currChainTs);
}
