# HydraGon Core Contracts

[![Solidity CI](https://github.com/Hydra-Chain/hydragon-core-contracts/actions/workflows/ci.yml/badge.svg)](https://github.com/Hydra-Chain/hydragon-core-contracts/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/Hydra-Chain/hydragon-core-contracts/badge.svg?branch=main&t=ZTUm69)](https://coveralls.io/github/Hydra-Chain/hydragon-core-contracts?branch=main)

**_Note: This repo is based on Polygon Edge core contracts._**

## Contents

- [Known discrepancies](#known-discrepancies)
- [Repo Architecture](#repo-architecture)
  - [Contracts](#contracts)
  - [General Repo Layout](#general-repo-layout)
- [Using This Repo](#using-this-repo)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Compiling Contracts](#compiling-contracts)
  - [Running Tests](#running-tests)
  - [Check Test Coverage](#check-test-coverage)
  - [Run Slither](#run-slither)
  - [Continuous Integration](#continuous-integration)
  - [Documentation](#documentation)

## Known discrepancies

- The epoch increases at the beginning of the last block of an epoch, which results in the following:
  - If a user changes its stake (or delegation) in the last block of an epoch X, the change will be applied on its voting power (or validator status) at epoch X + 2, because actually he made the balance change in epoch x + 1

## Repo Architecture

### Contracts

There are a several different contracts with different roles in the suite, as such an architecture diagram of the contents of `contracts/` should be useful in understanding where to find what you're looking for:

```ml
│ APRCalculator/ - "APR reward, bonuses and price"
├─ MacroFactor - "updates Macro Factor based on price"
├─ Price - "updates prices from price Oracle"
├─ RSI - "update RSI based on price"
│ BLS - "BLS signature operations"
│ common/ "commonly used contracts/libraries"
├─ Governed - "handles governance logic"
├─ libs/ "libraries used for specific applications"
├─ Liquid — "handles liquidity tokens minting/burning and debts"
├─ System - "various infra/precompile addresses on the chain"
├─ Vesting — "handles base vesting functions for vested positions"
├─ Withdrawal — "handles withdrawing hydra from contracts"
│ GenesisProxy — "the genesis proxy contract"
│ Faucet — "faucet for the test-net"
│ HydraChain/ — "commit epochs, keeps validators data"
├─ DaoIncentive - "distribute rewards for DAOs"
├─ Inspector - "handles validator bans"
├─ ValidatorManager - "keeps validator information"
├─ ValidatorsData - "real-time data for validators voting power"
├─ Whitelisting - "whitelisting users (could disable)"
│ HydraDelegation/ - "handle delegations and commissions"
├─ DelegationPoolLib - "lib for the pool of the staker to delegators"
├─ LiquidDelegation - "handles giving liquidity tokens on delegate"
├─ VestedDelegation - "delegating with vested position"
│ HydraStaking/ — "handles staking and distributes rewards"
├─ DelegatedStaking - "trigger updates on delegation"
├─ LiquidStaking - "handles giving liquidity tokens on staking"
├─ PenalizeableStaking - "penalize staker on ban"
├─ StateSynchStaking - "synch the state on change"
├─ VestedStaking - "staking with vested positions"
│ HydraVault/ — "vault to keep funds"
│ LiquidityToken/ — "liquid token ERC20, representing the staked/delegated Hydra"
│ PriceOracle/ — "oracle which validators vote for a price"
├─ SortedPriceList - "list for validators to vote easily on price"
│ RewardWallet/ — "wallet that distributes the rewards"
│ VestingManager/ — "vesting manager that is needed for vested delegation"
├─ VestingManagerFactory - "factory creating a vesting manager easily"
```

#### Contracts addresses:

- HydraChainContract: 0x0000000000000000000000000000000000000101 (predeployed, proxy upgradeable)
- HydraChainContractV1: 0x0000000000000000000000000000000000001011 (implementation, predeployed)
- BLSContract: 0x0000000000000000000000000000000000000102 (predeployed, proxy upgradeable)
- BLSContractV1: 0x0000000000000000000000000000000000001021 (implementation, predeployed)
- HydraStaking: 0x0000000000000000000000000000000000000104 (predeployed, proxy upgradeable)
- HydraStakingV1: 0x0000000000000000000000000000000000001041 (implementation, predeployed)
- FeeHandlerContract: 0x0000000000000000000000000000000000000106 (predeployed, proxy upgradeable) - HydraVault instance
- FeeHandlerContractV1: 0x0000000000000000000000000000000000001061 (implementation, predeployed)
- HydraDelegation: 0x0000000000000000000000000000000000000107 (predeployed, proxy upgradeable)
- HydraDelegationV1: 0x0000000000000000000000000000000000001071 (implementation, predeployed)
- VestingManagerFactory: 0x0000000000000000000000000000000000000108 (predeployed, proxy upgradeable)
- VestingManagerFactoryV1: 0x0000000000000000000000000000000000001081 (implementation, predeployed)
- APRCalculatorContract: 0x0000000000000000000000000000000000000109 (predeployed, proxy upgradeable)
- APRCalculatorContractV1: 0x0000000000000000000000000000000000001091 (implementation, predeployed)
- RewardWalletContract: 0x0000000000000000000000000000000000000110 (predeployed, proxy upgradeable)
- RewardWalletContractV1: 0x0000000000000000000000000000000000001101 (implementation, predeployed)
- DAOIncentiveVaultContract: 0x0000000000000000000000000000000000000111 (predeployed, proxy upgradeable) - HydraVault instance
- DAOIncentiveVaultContractV1: 0x0000000000000000000000000000000000001111 (implementation, predeployed)
- PriceOracle: 0x0000000000000000000000000000000000000112 (predeployed, proxy upgradeable)
- PriceOracleV1: 0x0000000000000000000000000000000000001121 (implementation, predeployed)
- LiquidityToken: 0x0000000000000000000000000000000000001013 (predeployed)

#### APRCalculator:

Saving the values of the APR, bonuses and price of Hydra

- Macro Factor: used to multiply the base APR and adjust the APR for positions depending on the price movement between 310 days and the last 115 days
- Price: updates the price for the contracts (update is possible only through PriceOracle) and triggers an update on bonuses depending on the price change, it also can guard bonuses by changing their values to default in critical situations
- RSI - Updates the RSI bonus, depending on the average gain and loss for the last 14 days, the RSI bonus is used in vested positions

#### BLS:

Used for register validators, reduces the size of signature data to store on-chain
Boneh–Lynn–Shacham (BLS) signature scheme on Barreto-Naehrig 254 bit curve (BN-254)

#### HydraChain:

Contract for committing epochs and keeping validators' data, handling validators' access

- Dao Incentive: Distributes rewards that are kept for DAOs in the network, later those rewards are sent to the vault and could be sent to a specific contract if the governance agrees that is it helping the network!
- Inspector: Handles validator bans, initiating a ban after certain inactivity of blocks and permanent ban applying penalty and giving reward (if non-governance wallet) ban the user!
- Validator Manager: Handles validator information like status, keeping registered information and more.
- Validators Data: Keep real-time data for validator voting power.
- Whitelisting: Used for whitelisting addresses (whitelisted addresses can register) this feature can also be disabled so anyone can register and set a node

#### HydraStaking:

Contracts that keep the validator’s stake and distribute rewards

- Staking - handles the base stake functions
- Delegated Staking - synch information on delegate from Hydra Delegation contract
- Liquid Staking - handles actions within the Lydra token, including minting, burning, calculating liquidity Debts and more.
- Penalizeable Staking - handle penalizing validators on a ban, and withdrawing banned funds
- StateSyncStaking - This contract is used to emit a specific event when staked balance changes
- Vested Staking - Handle vested staked positions

#### HydraDelegation:

Handles Delegation functions, for delegators and commissions for validators

- Delegation: Keep the base delegate functionality
- Delegation Pool Lib: This library is used for managing delegators and their rewards within a staking pool.
- Liquid Delegation - handles actions within the Lydra token, including minting, burning, calculating liquidity Debts and more.
- Vested Delegation - handling vested positions (through Managers), swapping, delegating, cutting and more.

#### HydraVault:

A contract that is used for keeping DAO Incentive funds and distributes them to a contract

#### LiquidityToken:

An ERC20 that represents the staked/delegated Hydra, could be used for trading while waiting for the position to grow.

#### PriceOracle:

An oracle that validators vote from, agreeing on a specific price and updating it on the APR calculator.

- SortedPriceList: Library for keeping a sorted list when validators vote, so we can easily calculate the average price later.

#### RewardWallet:

A contract that distributes the rewards for stakers and delegators

#### VestingManager:

A manager that handles your vested positions (could have one manager per positions on a validator) If you need to have 2 positions on the same validator that are not finished are claimed, you need 2 managers. One manager could handle many validator positions.

- Vesting Manager Factory - a contract that creates vesting managers and keeps that for user vesting managers addresses.

### General Repo Layout

This repo is a hybrid [Hardhat](https://hardhat.org) and [Foundry](https://getfoundry.sh/) environment. There are a number of add-ons, some of which we will detail here. Unlike standard Foundry environments, the contracts are located in `contracts/` (as opposed to `src/`) in order to conform with the general Hardhat project architecture. The Foundry/Solidity tests live in `test/forge/` whereas the Hardhat/Typescript tests are at the root level of `test/`. (For more details on the tests, see [Running Tests](#running-tests) in the [Using This Repo](#using-this-repo) section.)

The following is a brief overview of some of the files and directories in the project root:

```ml
│ .github/workflows/ - "CI (Github Actions) script: formats, lints, runs tests, coverage, Slither"
│ contracts/ - "all smart contracts, including mocks, but excluding Foundry tests and libs"
│ docs/ - "smart contract docs autogenerated from natspec"
│ lib/ - "smart contract libraries utilized by Foundry"
│ scripts/ - "Hardhat scripts, currently not updated, may contain deployment scripts in the future"
│ test/ - "both HH/TS and Foundry/Sol tests"
│ ts/ - "Typescript libraries for BLS/Elliptic Curves for testing BLS/BN256G2"
│ types/ - "Typescript types"
│ .env.example - "example env var file for using the HH env to connect with public nets/testnets"
│ .eslint.js - "JavaScript/TypeScript linter settings"
│ .nvmrc - "recommended Node version using nvm"
│ .prettierrc - "code formatting settings"
│ .solcover.js - "solidity-coverage settings"
│ .solhint.json - "Solidity linter settings"
│ foundry.toml - "Foundry configuration file"
│ hardhat.config.ts - "Hardhat configuration file"
│ slither.config.json - "settings for the Slither static analyzer"
```

The `package-lock.json` is also provided to ensure the ability to install the same versions of the npm packages used in development and testing.

## Using This Repo

### Requirements

In order to work with this repo locally, you will need Node (preferably using [nvm](https://github.com/nvm-sh/nvm)) in order to work with the Hardhat part of the repo.

In addition, to work with Foundry, you will need to have it installed. The recommended method is to use their `foundryup` tool, which can be installed (and automatically install Foundry) using this command:

```bash
curl -L https://foundry.paradigm.xyz | bash
```

Note that this only works on Linux and Mac. For Windows, or if `foundryup` doesn't work, consult [their documentation](https://book.getfoundry.sh/getting-started/installation).

### General Repo Layout

This repo is a hybrid [Hardhat](https://hardhat.org) and [Foundry](https://getfoundry.sh/) environment. There are a number of add-ons, some of which we will detail here. Unlike standard Foundry environments, the contracts are located in `contracts/` (as opposed to `src/`) in order to conform with the general Hardhat project architecture. The Foundry/Solidity tests live in `test/forge/` whereas the Hardhat/Typescript tests are at the root level of `test/`. (For more details on the tests, see [Running Tests](#running-tests) in the [Using This Repo](#using-this-repo) section.)

Install Foundry libs:

In addition, to work with Foundry, you will need to have it installed. The recommended method is to use their `foundryup` tool, which can be installed (and automatically install Foundry) using this command:

```bash
curl -L https://foundry.paradigm.xyz | bash
```

Note that this only works on Linux and Mac. For Windows, or if `foundryup` doesn't work, consult [their documentation](https://book.getfoundry.sh/getting-started/installation).

### Installation

**You do not need to clone this repo in order to interact with the HydraGon core contracts**

If you would like to work with these contracts in a development environment, first clone the repo:

```bash
git clone git@github.com:Hydra-Chain/hydragon-core-contracts.git
```

If you have [nvm](https://github.com/nvm-sh/nvm) installed (recommended), you can run `nvm use #` to set your version of Node to the same as used in development and testing.

Install JS/TS (Hardhat) dependencies:

```bash
npm i
```

Install Foundry libs:

```bash
forge install
```

### Environment Setup

There are a few things that should be done to set up the repo once you've cloned it and installed the dependencies and libraries. An important step for various parts of the repo to work properly is to set up a `.env` file. There is an `.example.env` file provided, copy it and rename the copy `.env`.

### Compiling Contracts

**Hardhat:**

```bash
npx hardhat compile --show-stack-traces
```

`hardhat-ts` automatically generates typings for you after compilation, to use in tests and scripts. You can import them like: `import { ... } from "../typechain-types";`

Similarly, the `hardhat-dodoc` package autogenerates smart contract documentation in `docs/` every time Hardhat compiles the contract. If you wish to disable this, uncomment the `runOnCompile: false` line in the `dodoc` object in `hardhat.config.ts`.

**Foundry:**

```bash
forge build
```

### Running tests

As mentioned previously, there are two separate test suites, one in Hardhat/Typescript, and the other in Foundry/Solidity. The HH tests are structured more as scenario tests, generally running through an entire interaction or process, while the Foundry tests are structured more as unit tests. This is coincidental and is not a set rule.

**Hardhat:**

```bash
npx hardhat test
```

The Hardhat tests have gas reporting enabled by default, you can disable them from `hardhat.config.ts` by setting `enabled` in the `gasReporter` object in `hardhat.config.ts` or by setting `REPORT_GAS` to `false` in the `.env`.

**Foundry:**

```bash
forge test
```

Simple gas profiling is included in Foundry tests by default. For a more complete gas profile using Foundry, see [their documentation](https://book.getfoundry.sh/forge/gas-reports).

**Hardhat & Foundry**

```bash
npm run test
```

### Linting

The linters run from inside the Hardhat/JS environment.

```bash
npm run lint      # runs all linters at once

npm run lint:sol  # only runs solhint and prettier
npm run lint:ts   # only runs prettier and eslint
```

### Check Test Coverage

We do not know of a way to see the general coverage from the TS and Solidity tests combined at this juncture. Instead, the coverage of each suite can be checked individually.

**Hardhat:**

```bash
npx hardhat coverage

# or

npm run coverage
```

**Foundry:**

```bash
forge coverage
```

### Run Slither

First, install slither by following the instructions [here](https://github.com/crytic/slither#how-to-install).
Then, run:

```bash
slither .

# or

npm run slither
```

### Continuous Integration

There is a CI script for Github Actions in `.github/workflows/`. Currently it runs:

- linters
- both test suites (if 1 test fail the job fails)
- coverage report (HH & Foundry)
- gas report
- Slither

### Documentation

This repo makes use of [Dodoc](https://github.com/primitivefinance/primitive-dodoc), a Hardhat plugin from Primitive Finance which generates Markdown docs on contracts from their natspec. The docs are generated on every compile and can be found in the `docs/` directory.
