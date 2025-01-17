// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";

import {HydraChain, ValidatorInit, IHydraChain} from "contracts/HydraChain/HydraChain.sol";
import {HydraStakingV2, StakerInit, IHydraStaking} from "contracts/HydraStaking/HydraStakingV2.sol";
import {HydraDelegationV2, IHydraDelegation} from "contracts/HydraDelegation/HydraDelegationV2.sol";
import {APRCalculator, IAPRCalculator} from "contracts/APRCalculator/APRCalculator.sol";
import {RewardWallet, IRewardWallet} from "contracts/RewardWallet/RewardWallet.sol";
import {PriceOracle} from "contracts/PriceOracle/PriceOracle.sol";
import {LiquidityToken} from "contracts/LiquidityToken/LiquidityToken.sol";
import {VestingManagerFactory, IVestingManagerFactory} from "contracts/VestingManager/VestingManagerFactory.sol";
import {HydraVault} from "contracts/HydraVault/HydraVault.sol";
import {BLS, IBLS} from "contracts/BLS/BLS.sol";

/*//////////////////////////////////////////////////////////////////////////
                                INITIALIZER
//////////////////////////////////////////////////////////////////////////*/

abstract contract InitializedContracts is Test {
    HydraChain hydraChain;
    HydraStakingV2 hydraStaking;
    HydraDelegationV2 hydraDelegation;
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
        hydraStaking = new HydraStakingV2();
        hydraDelegation = new HydraDelegationV2();
        aprCalculator = new APRCalculator();
        rewardWallet = new RewardWallet();
        priceOracle = new PriceOracle();
        liquidityToken = new LiquidityToken();
        vestingManagerFactory = new VestingManagerFactory();
        hydraVault = new HydraVault();
        bls = new BLS();

        governance = address(0x123);
        vm.startPrank(SYSTEM);

        // ⭐️ Initialize LiquidityToken
        liquidityToken.initialize(
            "Liquidity Token",
            "LQT",
            governance,
            address(hydraStaking),
            address(hydraDelegation)
        );

        // create an array of 310 random numbers between 300 and 600
        uint256[310] memory prices;
        for (uint256 i = 0; i < 309; i++) {
            prices[i] = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % 300) + 300;
        }
        // ⭐️ Initialize APRCalculator
        aprCalculator.initialize(governance, address(hydraChain), address(priceOracle), prices);

        // ⭐️ Initialize VestingManagerFactory
        vestingManagerFactory.initialize(address(hydraDelegation), address(liquidityToken));

        // ⭐️ Initialize PriceOracle
        priceOracle.initialize(address(hydraChain), address(aprCalculator));

        // Convert fixed-size array to dynamic array
        address[] memory rewardWalletAddresses = new address[](3);
        rewardWalletAddresses[0] = address(hydraChain);
        rewardWalletAddresses[1] = address(hydraStaking);
        rewardWalletAddresses[2] = address(hydraDelegation);
        // ⭐️ Initialize RewardWallet
        rewardWallet.initialize(rewardWalletAddresses);

        // Setting initial validators
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

        // ⭐️ Initialize HydraChain
        hydraChain.initialize(
            validatorInit,
            governance,
            address(hydraStaking),
            address(hydraDelegation),
            address(rewardWallet),
            address(hydraVault),
            IBLS(address(bls))
        );

        // ⭐️ Initialize HydraStaking
        hydraStaking.initialize(
            stakerInit,
            1 ether,
            governance,
            address(aprCalculator),
            address(hydraChain),
            address(hydraDelegation),
            address(rewardWallet),
            address(liquidityToken)
        );

        // ⭐️ Initialize HydraDelegation
        hydraDelegation.initialize(
            stakerInit,
            1,
            governance,
            address(aprCalculator),
            address(hydraChain),
            address(hydraStaking),
            address(vestingManagerFactory),
            address(rewardWallet),
            address(liquidityToken)
        );
    }
}

/*//////////////////////////////////////////////////////////////////////////
                            INITIALIZATION TEST
//////////////////////////////////////////////////////////////////////////*/

contract TestInitlizedContracts is InitializedContracts {
    // APRCalculator

    function test_getBaseAPR() public {
        assertEq(aprCalculator.getBaseAPR(), 500);
    }

    function test_getDENOMINATOR() public {
        assertEq(aprCalculator.getDENOMINATOR(), 10000);
    }

    function test_getDisabledBonusesUpdates() public {
        assertEq(aprCalculator.disabledBonusesUpdates(), false);
    }

    function test_getDefaultMacroFactor() public {
        assertEq(aprCalculator.defaultMacroFactor(), 7500);
    }

    function test_getRSI() public view {
        assert(aprCalculator.rsi() >= 0);
        assert(aprCalculator.rsi() <= aprCalculator.MAX_RSI_BONUS());
    }

    function test_getMacroFactor() public view {
        assert(aprCalculator.macroFactor() >= aprCalculator.MIN_MACRO_FACTOR());
        assert(aprCalculator.macroFactor() <= aprCalculator.MAX_MACRO_FACTOR());
    }

    // LiquidityToken

    function test_getName() public {
        assertEq(liquidityToken.name(), "Liquidity Token");
    }

    function test_getSymbol() public {
        assertEq(liquidityToken.symbol(), "LQT");
    }

    function test_getGovernance() public view {
        assert(liquidityToken.hasRole(liquidityToken.DEFAULT_ADMIN_ROLE(), governance));
    }

    function test_getStaking() public view {
        assert(liquidityToken.hasRole(liquidityToken.SUPPLY_CONTROLLER_ROLE(), address(hydraStaking)));
    }

    function test_getDelegation() public view {
        assert(liquidityToken.hasRole(liquidityToken.SUPPLY_CONTROLLER_ROLE(), address(hydraDelegation)));
    }

    // VestingManagerFactory

    function test_getDelegationAddr() public view {
        assert(address(vestingManagerFactory.beacon()) != address(0));
    }

    // PriceOracle

    function test_getHydraChainAddrFromOracle() public view {
        assert(priceOracle.hydraChainContract() == IHydraChain(address(hydraChain)));
    }

    function test_getAPRCalculatorAddrFromOracle() public view {
        assert(priceOracle.aprCalculatorContract() == IAPRCalculator(address(aprCalculator)));
    }

    // RewardWallet

    function test_getManagersFromRewardWallet() public view {
        assert(rewardWallet.rewardManagers(address(hydraChain)) == true);
        assert(rewardWallet.rewardManagers(address(hydraStaking)) == true);
        assert(rewardWallet.rewardManagers(address(hydraDelegation)) == true);
    }

    // HydraChain

    function test_getGovernanceFromHydraChain() public view {
        bytes32 role = hydraChain.DEFAULT_ADMIN_ROLE();
        assert(hydraChain.hasRole(role, governance) == true);
    }

    function test_getStakingFromHydraChain() public view {
        assert(hydraChain.hydraStakingContract() == IHydraStaking(address(hydraStaking)));
    }

    function test_getDelegationFromHydraChain() public view {
        assert(hydraChain.hydraDelegationContract() == IHydraDelegation(address(hydraDelegation)));
    }

    function test_getRewardWalletFromHydraChain() public view {
        assert(hydraChain.rewardWalletContract() == IRewardWallet(address(rewardWallet)));
    }

    function test_getHydraVaultFromHydraChain() public view {
        assert(hydraChain.daoIncentiveVaultContract() == address(hydraVault));
    }

    function test_getBLSFromHydraChain() public view {
        assert(hydraChain.bls() == IBLS(address(bls)));
    }

    function test_getValidatorsStatusFromHydraChain() public view {
        assert(hydraChain.isValidatorActive(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) == true);
    }

    // HydraStaking

    function test_getGovernanceFromHydraStaking() public view {
        bytes32 role = hydraStaking.DEFAULT_ADMIN_ROLE();
        assert(hydraStaking.hasRole(role, governance) == true);
    }

    function test_getMinStakeFromHydraStaking() public view {
        assert(hydraStaking.minStake() == 1 ether);
    }

    function test_getLiquidityTokenFromHydraStaking() public view {
        assert(hydraDelegation.liquidToken() == address(liquidityToken));
    }

    function test_getHydraChainFromHydraStaking() public view {
        assert(hydraStaking.hydraChainContract() == IHydraChain(address(hydraChain)));
    }

    function test_getAPRCalculatorFromHydraStaking() public view {
        assert(hydraStaking.aprCalculatorContract() == IAPRCalculator(address(aprCalculator)));
    }

    function test_getDelegationFromHydraStaking() public view {
        assert(hydraStaking.delegationContract() == IHydraDelegation(address(hydraDelegation)));
    }

    function test_getRewardWalletFromHydraStaking() public view {
        assert(hydraStaking.rewardWalletContract() == IRewardWallet(address(rewardWallet)));
    }

    function test_getStakeOfFromHydraStaking() public view {
        assert(hydraStaking.stakeOf(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) == 2000000000000000000);
    }

    function test_getVestingLiquidityDecreasePerWeekStaking() public view {
        assert(hydraStaking.vestingLiquidityDecreasePerWeek() == 133);
    }

    // HydraDelegation

    function test_getGovernanceFromHydraDelegation() public view {
        bytes32 role = hydraDelegation.DEFAULT_ADMIN_ROLE();
        assert(hydraDelegation.hasRole(role, governance) == true);
    }

    function test_getInitialCommissionFromHydraDelegation() public view {
        assert(hydraDelegation.delegationCommissionPerStaker(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) == 1);
    }

    function test_getLiquidityTokenFromHydraDelegation() public view {
        assert(hydraDelegation.liquidToken() == address(liquidityToken));
    }

    function test_getAPRCalculatorFromHydraDelegation() public view {
        assert(hydraDelegation.aprCalculatorContract() == IAPRCalculator(address(aprCalculator)));
    }

    function test_getStakingFromHydraDelegation() public view {
        assert(hydraDelegation.hydraStakingContract() == IHydraStaking(address(hydraStaking)));
    }

    function test_getHydraChainFromHydraDelegation() public view {
        assert(hydraDelegation.hydraChainContract() == IHydraChain(address(hydraChain)));
    }

    function test_getVestingManagerFactoryFromHydraDelegation() public view {
        assert(
            hydraDelegation.vestingManagerFactoryContract() == IVestingManagerFactory(address(vestingManagerFactory))
        );
    }

    function test_getRewardWalletFromHydraDelegation() public view {
        assert(hydraDelegation.rewardWalletContract() == IRewardWallet(address(rewardWallet)));
    }

    function test_getVestingLiquidityDecreasePerWeek() public view {
        assert(hydraDelegation.vestingLiquidityDecreasePerWeek() == 133);
    }
}
