/* eslint-disable camelcase */
/* eslint-disable node/no-extraneous-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import * as hre from "hardhat";
import { BigNumber, ContractTransaction } from "ethers";

import * as mcl from "../ts/mcl";
import { Fixtures, Signers } from "./mochaContext";
import { CHAIN_ID, DAY, DENOMINATOR, DOMAIN, EPOCHS_YEAR, SYSTEM, WEEK } from "./constants";
import { LiquidityToken } from "../typechain-types/contracts/LiquidityToken/LiquidityToken";
import {
  APRCalculator,
  HydraChain,
  HydraDelegation,
  HydraStaking,
  VestingManager,
  VestingManager__factory,
  VestingManagerFactory,
} from "../typechain-types";

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

// --------------- Epoch handlers ---------------

export async function getMaxEpochReward(hydraStaking: HydraStaking) {
  const totalSupply = await hydraStaking.totalBalance();
  return totalSupply;
}

export async function commitEpoch(
  systemHydraChain: HydraChain,
  hydraStaking: HydraStaking,
  validators: SignerWithAddress[],
  epochSize: BigNumber,
  increaseTime?: number
): Promise<{ commitEpochTx: ContractTransaction; distributeRewardsTx: ContractTransaction }> {
  const currEpochId = await systemHydraChain.currentEpochId();
  const prevEpochId = currEpochId.sub(1);
  const previousEpoch = await systemHydraChain.epochs(prevEpochId);
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

  const commitEpochTx = await systemHydraChain.commitEpoch(currEpochId, newEpoch, epochSize, validatorsUptime);

  const maxReward = await getMaxEpochReward(hydraStaking);
  const distributeRewardsTx = await hydraStaking
    .connect(systemHydraChain.signer)
    .distributeRewardsFor(currEpochId, validatorsUptime, epochSize, {
      value: maxReward,
    });

  return { commitEpochTx, distributeRewardsTx };
}

export async function commitEpochs(
  systemHydraChain: HydraChain,
  hydraStaking: HydraStaking,
  validators: SignerWithAddress[],
  numOfEpochsToCommit: number,
  epochSize: BigNumber,
  increaseTime?: number
) {
  if (epochSize.isZero() || numOfEpochsToCommit === 0) return;

  for (let i = 0; i < numOfEpochsToCommit; i++) {
    await commitEpoch(systemHydraChain, hydraStaking, validators, epochSize, increaseTime);
  }
}

// --------------- Validator handlers ---------------

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

export async function registerValidator(hydraChain: HydraChain, account: any) {
  const keyPair = mcl.newKeyPair();
  const signature = mcl.signValidatorMessage(DOMAIN, CHAIN_ID, account.address, keyPair.secret).signature;

  const tx = await hydraChain.connect(account).register(mcl.g1ToHex(signature), mcl.g2ToHex(keyPair.pubkey));
  const txReceipt = await tx.wait();

  if (txReceipt.status !== 1) {
    throw new Error("Cannot register address");
  }
}

export async function getValidatorReward(hydraStaking: HydraStaking, validatorAddr: string) {
  return hydraStaking.unclaimedRewards(validatorAddr);
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

// --------------- Index handlers ---------------

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

export function findProperBalanceChangeIndex(arr: any[], epochNum: BigNumber): number {
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
    throw new Error("findLastPositionChangeIndex: Invalid epoch number");
  }

  return closestIndex;
}

export async function retrieveRPSData(
  hydraChain: HydraChain,
  hydraDelegation: HydraDelegation,
  validator: string,
  manager: string
) {
  const position = await hydraDelegation.vestedDelegationPositions(validator, manager);
  const maturedIn = await getClosestMaturedTimestamp(position);
  const currentEpochId = await hydraChain.currentEpochId();
  const rpsValues = await hydraDelegation.getRPSValues(validator, 0, currentEpochId);
  const epochNum = findProperRPSIndex(rpsValues, hre.ethers.BigNumber.from(maturedIn));
  const delegationPoolParamsHistory = await hydraDelegation.getDelegationPoolParamsHistory(validator, manager);
  const balanceChangeIndex = findProperBalanceChangeIndex(
    delegationPoolParamsHistory,
    hre.ethers.BigNumber.from(epochNum)
  );

  return { position, epochNum, balanceChangeIndex };
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

// --------------- Delegation handlers ---------------

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
  vestingManagerFactory: VestingManagerFactory,
  account: any,
  VestManagerFactory: any
): Promise<VestingManager> {
  // Find user vesting position based on the emitted  events
  const filter = vestingManagerFactory.filters.NewVestingManager(account.address);
  const positionAddr = (await vestingManagerFactory.queryFilter(filter))[0].args.newClone;
  const manager = VestManagerFactory.attach(positionAddr);

  return manager.connect(account);
}

export async function claimPositionRewards(
  hydraChain: HydraChain,
  hydraDelegation: HydraDelegation,
  vestManager: VestingManager,
  validator: string
) {
  const position = await hydraDelegation.vestedDelegationPositions(validator, vestManager.address);
  const currentEpochId = await hydraChain.currentEpochId();
  const rpsValues = await hydraDelegation.getRPSValues(validator, 0, currentEpochId);
  const rpsIndex = findProperRPSIndex(rpsValues, position.end);
  await vestManager.claimVestedPositionReward(validator, rpsIndex, 0);
}

export async function createNewVestManager(vestingManagerFactory: VestingManagerFactory, owner: SignerWithAddress) {
  const tx = await vestingManagerFactory.connect(owner).newVestingManager();
  const receipt = await tx.wait();
  const event = receipt.events?.find((e) => e.event === "NewVestingManager");
  const address = event?.args?.newClone;

  const VestManagerFactory = new VestingManager__factory(owner);
  const vestManager: VestingManager = VestManagerFactory.attach(address);

  return { newManagerFactory: vestingManagerFactory, newManager: vestManager };
}

export async function attachAddressToVestingManager(address: string) {
  const VestManagerFactory = new VestingManager__factory();
  const attachedManager: VestingManager = VestManagerFactory.attach(address);

  return attachedManager;
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

export async function applyMaxReward(aprCalculator: APRCalculator, reward: BigNumber) {
  const base = await aprCalculator.base();
  const rsi = await aprCalculator.rsi();
  const vestBonus = await aprCalculator.getVestingBonus(52);

  // calculate expected reward
  return base.add(vestBonus).mul(rsi).mul(reward).div(DENOMINATOR.mul(DENOMINATOR)).div(EPOCHS_YEAR);
}

export async function applyCustomReward(
  hydraDelegation: HydraDelegation,
  validator: string,
  delegator: string,
  reward: BigNumber,
  rsi: boolean
) {
  const position = await hydraDelegation.vestedDelegationPositions(validator, delegator);
  let bonus = position.base.add(position.vestBonus);
  let divider = DENOMINATOR;
  if (rsi && !position.rsiBonus.isZero()) {
    bonus = bonus.mul(position.rsiBonus);
    divider = divider.mul(DENOMINATOR);
  }

  return reward.mul(bonus).div(divider).div(EPOCHS_YEAR);
}

export async function createManagerAndVest(
  vestingManagerFactory: VestingManagerFactory,
  account: SignerWithAddress,
  validator: string,
  duration: number,
  amount: BigNumber
) {
  const { newManager } = await createNewVestManager(vestingManagerFactory, account);

  await newManager.openVestedDelegatePosition(validator, duration, {
    value: amount,
  });

  return newManager;
}

export async function getDelegatorPositionReward(
  hydraChain: HydraChain,
  hydraDelegation: HydraDelegation,
  validator: string,
  delegator: string
) {
  // prepare params for call
  const { epochNum, balanceChangeIndex } = await retrieveRPSData(hydraChain, hydraDelegation, validator, delegator);

  return await hydraDelegation.getDelegatorPositionReward(validator, delegator, epochNum, balanceChangeIndex);
}

// function that returns whether a position is matured or not
async function hasMatured(positionEnd: BigNumber, positionDuration: BigNumber) {
  const currChainTs = await time.latest();

  return positionEnd && positionDuration && positionEnd.add(positionDuration).lte(currChainTs);
}

export async function getPermitSignature(
  wallet: any,
  token: LiquidityToken,
  spender: string,
  value: any,
  deadline: string
) {
  const [nonce, name, version, chainId] = await Promise.all([
    token.nonces(wallet.address),
    token.name(),
    (await token.eip712Domain()).version,
    wallet.getChainId(),
  ]);

  return hre.ethers.utils.splitSignature(
    await wallet._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: token.address,
      },
      {
        Permit: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "spender",
            type: "address",
          },
          {
            name: "value",
            type: "uint256",
          },
          {
            name: "nonce",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
        ],
      },
      {
        owner: wallet.address,
        spender,
        value,
        nonce,
        deadline,
      }
    )
  );
}

export async function calculateTotalPotentialPositionReward(
  hydraDelegation: HydraDelegation,
  validator: string,
  delegator: string
) {
  const position = await hydraDelegation.vestedDelegationPositions(validator, delegator);
  const rawReward = await hydraDelegation.getRawDelegatorReward(validator, delegator);
  let bonus = position.base.add(position.vestBonus);
  let divider = hre.ethers.BigNumber.from(10000);
  if (!position.rsiBonus.eq(0)) {
    bonus = bonus.mul(position.rsiBonus);
    divider = divider.mul(10000);
  }

  return rawReward.mul(bonus).div(divider).div(EPOCHS_YEAR);
}
