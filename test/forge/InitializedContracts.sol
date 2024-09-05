// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";

import {HydraChain, ValidatorInit} from "contracts/HydraChain/HydraChain.sol";
import {HydraStaking, StakerInit} from "contracts/HydraStaking/HydraStaking.sol";
import {HydraDelegation} from "contracts/HydraDelegation/HydraDelegation.sol";
import {APRCalculator} from "contracts/APRCalculator/APRCalculator.sol";
import {RewardWallet} from "contracts/RewardWallet/RewardWallet.sol";
import {PriceOracle} from "contracts/PriceOracle/PriceOracle.sol";
import {LiquidityToken} from "contracts/LiquidityToken/LiquidityToken.sol";
import {VestingManagerFactory} from "contracts/VestingManager/VestingManagerFactory.sol";
import {HydraVault} from "contracts/HydraVault/HydraVault.sol";
import {BLS, IBLS} from "contracts/BLS/BLS.sol";

abstract contract InitializedContracts is Test {
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
    address[] public validators;
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

        governance = address(0x123);

        // Initialize LiquidityToken
        liquidityToken.initialize(
            "Liquidity Token",
            "LQT",
            governance,
            address(hydraStaking),
            address(hydraDelegation)
        );

        // Initialize APRCalculator
        // create an array of 310 random numbers between 300 and 600
        uint256[310] memory prices;
        for (uint256 i = 0; i < 309; i++) {
            prices[i] = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % 300) + 300;
        }
        aprCalculator.initialize(governance, address(hydraChain), address(priceOracle), prices);

        // Initialize VestingManagerFactory
        vestingManagerFactory.initialize(address(hydraDelegation));

        // Initialize PriceOracle
        priceOracle.initialize(address(hydraChain), address(aprCalculator));

        // Initialize RewardWallet
        // Convert fixed-size array to dynamic array
        address[] memory rewardWalletAddresses = new address[](3);
        rewardWalletAddresses[0] = address(hydraChain);
        rewardWalletAddresses[1] = address(hydraStaking);
        rewardWalletAddresses[2] = address(hydraDelegation);
        rewardWallet.initialize(rewardWalletAddresses);

        // Validator initialization
        validators.push(address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266));
        uint256[4] memory pubkeys = [
            0x15b9b97130698b3f960bb3a97bd9f87217d2b9a973e72e968b281ca8bc2a3a19,
            0x295d98eba42f966fb90b28fd25645fb5926eed22ccccf3b2f33df1ea622daf00,
            0x0541ca1563277bc3cc4af7613dba7a3671656487c9b6a7baf7aef94348e0e0c3,
            0x288e8196db9714db00024b502514f5fddb4bce69c710de72bc42c1c47ffc8466
        ];
        uint256[2] memory signatures = [
            0x2f415de09d03b54e689351636b0c5ff588ee014bc1107b59074fbb6c72139b2d,
            0x05cc27399b9652079564f07a7e39d77a90a0429c2aa0f5aed378e0e2cdf13f15
        ];

        ValidatorInit[] memory validatorInit = new ValidatorInit[](1);
        validatorInit[0] = ValidatorInit({
            addr: address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266),
            pubkey: pubkeys,
            signature: signatures
        });

        StakerInit[] memory stakerInit = new StakerInit[](1);
        stakerInit[0] = StakerInit({
            addr: address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266),
            stake: 2000000000000000000
        });

        // Initialize HydraChain
        hydraChain.initialize(
            validatorInit,
            governance,
            address(hydraStaking),
            address(hydraDelegation),
            address(aprCalculator),
            address(rewardWallet),
            address(hydraVault),
            IBLS(address(bls))
        );

        // Initialize HydraStaking
        hydraStaking.initialize(
            stakerInit,
            governance,
            0,
            address(liquidityToken),
            address(hydraChain),
            address(aprCalculator),
            address(hydraDelegation),
            address(rewardWallet)
        );

        // Initialize HydraDelegation
        hydraDelegation.initialize(
            stakerInit,
            governance,
            0,
            address(liquidityToken),
            address(aprCalculator),
            address(hydraStaking),
            address(hydraChain),
            address(vestingManagerFactory),
            address(rewardWallet)
        );
    }
}
