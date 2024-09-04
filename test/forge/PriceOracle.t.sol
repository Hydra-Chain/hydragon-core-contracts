// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";

import {HydraChain} from "contracts/HydraChain/HydraChain.sol";
import {HydraStaking} from "contracts/HydraStaking/HydraStaking.sol";
import {HydraDelegation} from "contracts/HydraDelegation/HydraDelegation.sol";
import {APRCalculator} from "contracts/APRCalculator/APRCalculator.sol";
import {RewardWallet} from "contracts/RewardWallet/RewardWallet.sol";
import {PriceOracle} from "contracts/PriceOracle/PriceOracle.sol";
import {LiquidityToken} from "contracts/LiquidityToken/LiquidityToken.sol";
import {VestingManagerFactory} from "contracts/VestingManager/VestingManagerFactory.sol";
import {HydraVault} from "contracts/HydraVault/HydraVault.sol";
import {BLS} from "contracts/BLS/BLS.sol";

abstract contract InitializeAllContracts is Test {
    HydraChain hydraChain;
    HydraStaking hydraStaking;
    HydraDelegation hydraDelegation;
    APRCalculator aprCalculator;
    RewardWallet rewardWallet;
    PriceOracle priceOracle;
    LiquidityToken liquidityToken;
    VestingManagerFactory vestingManagerFactory;
    HydraVault hydraVault;
    BLS bls;

    address public governance;
    address public constant SYSTEM = address(0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE);

    function setUp() public {
        hydraChain = new HydraChain();
        hydraStaking = new HydraStaking();
        hydraDelegation = new HydraDelegation();
        aprCalculator = new APRCalculator();
        rewardWallet = new RewardWallet();
        priceOracle = new PriceOracle();
        liquidityToken = new LiquidityToken();
        vestingManagerFactory = new VestingManagerFactory();
        hydraVault = new HydraVault();
        bls = new BLS();

        // Initialize VestingManagerFactory
        vestingManagerFactory.initialize(address(hydraDelegation));

        // Initialize PriceOracle
        priceOracle.initialize(address(hydraChain), address(aprCalculator));

        // Convert fixed-size array to dynamic array
        address[] memory rewardWalletAddresses = new address[](3);
        rewardWalletAddresses[0] = address(hydraChain);
        rewardWalletAddresses[1] = address(hydraStaking);
        rewardWalletAddresses[2] = address(hydraDelegation);
        // Initialize RewardWallet
        rewardWallet.initialize(rewardWalletAddresses);
        
    }
}
