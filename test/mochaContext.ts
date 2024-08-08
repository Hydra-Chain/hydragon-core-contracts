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
  HydraVault,
  PriceOracle,
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
      priceOracle: PriceOracle;
      rewardWallet: RewardWallet;
      DAOIncentiveVault: HydraVault;
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
      priceOracle: PriceOracle;
      rewardWallet: RewardWallet;
      DAOIncentiveVault: HydraVault;
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
      priceOracle: PriceOracle;
      rewardWallet: RewardWallet;
      DAOIncentiveVault: HydraVault;
    }>;
  };
  distributeVaultFundsFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      distributeVaultFundsTx: ContractTransaction;
      vestingManagerFactory: VestingManagerFactory;
      rewardWallet: RewardWallet;
      DAOIncentiveVault: HydraVault;
    }>;
  };
  rsiOverSoldConditionFixture: {
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
      DAOIncentiveVault: HydraVault;
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
      priceOracle: PriceOracle;
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
      priceOracle: PriceOracle;
      rewardWallet: RewardWallet;
    }>;
  };
  validatorsDataFixtureStateFixture: {
    (): Promise<{
      hydraChain: HydraChain;
      systemHydraChain: HydraChain;
      bls: BLS;
      hydraDelegation: HydraDelegation;
      hydraStaking: HydraStaking;
      liquidToken: LiquidityToken;
      aprCalculator: APRCalculator;
      priceOracle: PriceOracle;
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
      priceOracle: PriceOracle;
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
      rewardWallet: RewardWallet;
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
      rewardWallet: RewardWallet;
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
      rewardWallet: RewardWallet;
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
      rewardWallet: RewardWallet;
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
      rewardWallet: RewardWallet;
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
      rewardWallet: RewardWallet;
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
      rewardWallet: RewardWallet;
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
