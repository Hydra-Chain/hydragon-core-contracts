import "@nomicfoundation/hardhat-toolbox";
// import "@openzeppelin/hardhat-upgrades";
import "@primitivefi/hardhat-dodoc";
import * as dotenv from "dotenv";
// eslint-disable-next-line node/no-extraneous-import
import { HardhatUserConfig } from "hardhat/config";
// Fix BigInt serialization: https://github.com/GoogleChromeLabs/jsbi/issues/30
import "./big-int-fix.ts";

dotenv.config();

const config: HardhatUserConfig = {
  typechain: {
    target: "ethers-v6",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
    ],
  },
  networks: {
    hydraChain: {
      url: process.env.HYDRA_CHAIN_RPC || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hydraTest: {
      url: process.env.HYDRA_TESTNET_RPC || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      // allow impersonation of smart contracts without modifying balance
      gasPrice: 0,
      hardfork: "berlin",
      allowUnlimitedContractSize: true,
    },
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS as unknown as boolean) || false,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY !== undefined ? process.env.ETHERSCAN_API_KEY : "",
      goerli: process.env.ETHERSCAN_API_KEY !== undefined ? process.env.ETHERSCAN_API_KEY : "",
      sepolia: process.env.ETHERSCAN_API_KEY !== undefined ? process.env.ETHERSCAN_API_KEY : "",
    },
  },
  mocha: {
    timeout: 100000000,
  },
  dodoc: {
    // uncomment to stop docs from autogenerating each compile
    // runOnCompile: false,
  },
};

export default config;
