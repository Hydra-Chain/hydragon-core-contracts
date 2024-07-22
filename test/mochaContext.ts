/* eslint-disable camelcase */
/* eslint-disable node/no-extraneous-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import {
  BLS,
  LiquidityToken,
  HydraChain,
  HydraDelegation,
  HydraStaking,
  APRCalculator,
  VestingManagerFactory,
  VestingManager,
  RewardWallet,
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
  presetHydraChainStateFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      vestingManagerFactory: VestingManagerFactory;
      rewardWallet: RewardWallet;
    }>;
  };
  initializedHydraChainStateFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      vestingManagerFactory: VestingManagerFactory;
      rewardWallet: RewardWallet;
      validatorInit: {
        addr: string;
        pubkey: [BigNumberish, BigNumberish, BigNumberish, BigNumberish];
        signature: [BigNumberish, BigNumberish];
        stake: BigNumberish;
      };
    }>;
  };
  commitEpochTxFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      commitEpochTx: ContractTransaction;
      vestingManagerFactory: VestingManagerFactory;
      rewardWallet: RewardWallet;
    }>;
  };
  whitelistedValidatorsStateFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      vestingManagerFactory: VestingManagerFactory;
      rewardWallet: RewardWallet;
    }>;
  };
  registeredValidatorsStateFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      vestingManagerFactory: VestingManagerFactory;
      rewardWallet: RewardWallet;
    }>;
  };
  stakedValidatorsStateFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      vestingManagerFactory: VestingManagerFactory;
      rewardWallet: RewardWallet;
    }>;
  };
  newVestingValidatorFixture: {
    (): Promise<{
      stakerHydraStaking: HydraStaking;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      vestingManagerFactory: VestingManagerFactory;
    }>;
  };
  vestingRewardsFixture: {
    (): Promise<{
      stakerHydraStaking: HydraStaking;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
    }>;
  };
  withdrawableFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraStaking: HydraStaking;
      hydraDelegation: HydraDelegation;
      liquidToken: LiquidityToken;
      unstakedValidator: SignerWithAddress;
      unstakedAmount: BigNumber;
      vestingManagerFactory: VestingManagerFactory;
      aprCalculator: APRCalculator;
    }>;
  };
  delegatedFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraStaking: HydraStaking;
      hydraDelegation: HydraDelegation;
      liquidToken: LiquidityToken;
      vestingManagerFactory: VestingManagerFactory;
      aprCalculator: APRCalculator;
    }>;
  };
  vestManagerFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraStaking: HydraStaking;
      hydraDelegation: HydraDelegation;
      liquidToken: LiquidityToken;
      vestManager: VestingManager;
      vestManagerOwner: SignerWithAddress;
      vestingManagerFactory: VestingManagerFactory;
      aprCalculator: APRCalculator;
    }>;
  };
  vestedDelegationFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraStaking: HydraStaking;
      hydraDelegation: HydraDelegation;
      liquidToken: LiquidityToken;
      vestingManagerFactory: VestingManagerFactory;
      vestManager: VestingManager;
      vestManagerOwner: SignerWithAddress;
      delegatedValidator: SignerWithAddress;
    }>;
  };
  weeklyVestedDelegationFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraStaking: HydraStaking;
      hydraDelegation: HydraDelegation;
      liquidToken: LiquidityToken;
      vestingManagerFactory: VestingManagerFactory;
      vestManager: VestingManager;
      vestManagerOwner: SignerWithAddress;
      delegatedValidator: SignerWithAddress;
      aprCalculator: APRCalculator;
    }>;
  };
  validatorToBanFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      hydraStaking: HydraStaking;
      validatorToBan: SignerWithAddress;
    }>;
  };
  bannedValidatorFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      bannedValidator: SignerWithAddress;
      stakedAmount: BigNumber;
    }>;
  };
  swappedPositionFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraStaking: HydraStaking;
      hydraDelegation: HydraDelegation;
      liquidToken: LiquidityToken;
      vestingManagerFactory: VestingManagerFactory;
      vestManager: VestingManager;
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
