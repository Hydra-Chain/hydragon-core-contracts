/* eslint-disable camelcase */
/* eslint-disable node/no-extraneous-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import {
  BLS,
  LiquidityToken,
  RewardPool,
  System,
  ValidatorSet,
  VestManager,
  VestManager__factory,
} from "../typechain-types";

export interface Signers {
  accounts: SignerWithAddress[];
  admin: SignerWithAddress;
  validators: SignerWithAddress[];
  governance: SignerWithAddress;
  delegator: SignerWithAddress;
  rewardWallet: SignerWithAddress;
  system: SignerWithAddress;
}

export interface Fixtures {
  systemFixture: { (): Promise<System> };
  presetValidatorSetStateFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  initializedValidatorSetStateFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  commitEpochTxFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
      commitEpochTx: ContractTransaction;
    }>;
  };
  whitelistedValidatorsStateFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  registeredValidatorsStateFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  stakedValidatorsStateFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  newVestingValidatorFixture: {
    (): Promise<{
      stakerValidatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  vestingRewardsFixture: {
    (): Promise<{
      stakerValidatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  withdrawableFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
      unstakedValidator: SignerWithAddress;
      unstakedAmount: BigNumber;
    }>;
  };
  delegatedFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
    }>;
  };
  vestManagerFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
      VestManagerFactory: VestManager__factory;
      vestManager: VestManager;
      vestManagerOwner: SignerWithAddress;
    }>;
  };
  vestedDelegationFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
      VestManagerFactory: VestManager__factory;
      vestManager: VestManager;
      vestManagerOwner: SignerWithAddress;
      delegatedValidator: SignerWithAddress;
    }>;
  };
  weeklyVestedDelegationFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      bls: BLS;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
      VestManagerFactory: VestManager__factory;
      vestManager: VestManager;
      vestManagerOwner: SignerWithAddress;
      delegatedValidator: SignerWithAddress;
    }>;
  };
  validatorToBanFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      validatorToBan: SignerWithAddress;
    }>;
  };
  bannedValidatorFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      liquidToken: LiquidityToken;
      bannedValidator: SignerWithAddress;
      stakedAmount: BigNumber;
    }>;
  };
  swappedPositionFixture: {
    (): Promise<{
      validatorSet: ValidatorSet;
      systemValidatorSet: ValidatorSet;
      rewardPool: RewardPool;
      liquidToken: LiquidityToken;
      vestManager: VestManager;
      vestManagerOwner: SignerWithAddress;
      oldValidator: SignerWithAddress;
      newValidator: SignerWithAddress;
      rewardsBeforeSwap: BigNumber;
    }>;
  };
}

declare module "mocha" {
  export interface Context {
    fixtures: Fixtures;
    signers: Signers;
    uptime: any;
    epochId: BigNumber;
    epochSize: BigNumber;
    epochReward: BigNumber;
    epoch: {
      startBlock: BigNumber;
      endBlock: BigNumber;
      epochRoot: Uint8Array;
    };
    minStake: BigNumber;
    minDelegation: BigNumber;
    epochsInYear: number;
    chainId: number;
    validatorInit: {
      addr: string;
      pubkey: [BigNumberish, BigNumberish, BigNumberish, BigNumberish];
      signature: [BigNumberish, BigNumberish];
      stake: BigNumberish;
    };
  }
}
