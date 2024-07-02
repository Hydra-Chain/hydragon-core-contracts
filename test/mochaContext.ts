/* eslint-disable camelcase */
/* eslint-disable node/no-extraneous-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import {
  BLS,
  LiquidityToken,
  System,
  VestManager,
  VestManager__factory,
  HydraChain,
  HydraDelegation,
  HydraStaking,
  APRCalculator,
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
  presetHydraChainStateFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
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
    }>;
  };
  newVestingValidatorFixture: {
    (): Promise<{
      stakerHydraStake: HydraStaking;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
    }>;
  };
  vestingRewardsFixture: {
    (): Promise<{
      stakerHydraStake: HydraStaking;
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
      VestManagerFactory: VestManager__factory;
      vestManager: VestManager;
      vestManagerOwner: SignerWithAddress;
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
      VestManagerFactory: VestManager__factory;
      vestManager: VestManager;
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
      VestManagerFactory: VestManager__factory;
      vestManager: VestManager;
      vestManagerOwner: SignerWithAddress;
      delegatedValidator: SignerWithAddress;
    }>;
  };
  validatorToBanFixture: {
    (): Promise<{
      hydraChain: HydraChain;
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
      VestManagerFactory: VestManager__factory;
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
