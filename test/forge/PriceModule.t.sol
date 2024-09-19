// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";

import {APRCalculator} from "contracts/APRCalculator/APRCalculator.sol";

/*//////////////////////////////////////////////////////////////////////////
                                INITIALIZER
//////////////////////////////////////////////////////////////////////////*/

abstract contract InitlizeAPR is Test {
    APRCalculator aprCalculator;

    address public governance; // plays a role as PriceOracle in this test
    address public constant SYSTEM = address(0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE);

    function setUp() public virtual {
        aprCalculator = new APRCalculator();
        governance = address(0x123);

        // Initialize APRCalculator
        // create an array of 310 random numbers between 300 and 600
        uint256[310] memory prices;
        for (uint256 i = 0; i < 310; i++) {
            prices[i] = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % 300) + 300;
            if (i == 309) {
                prices[i] = 500;
            }
        }
        vm.prank(SYSTEM);
        aprCalculator.initialize(governance, governance, governance, prices);
    }
}

/*//////////////////////////////////////////////////////////////////////////
                            RANDOM PRICE TEST
//////////////////////////////////////////////////////////////////////////*/

contract TestUpdatePrice is InitlizeAPR {
    uint256 public constant MAX_UINT = uint256((2 ** 256 - 1));
    uint256 public constant MAX_UINT_DIV_DENOMINATOR_ON_POWER_OF_2 = MAX_UINT / 1e8;
    uint224 public constant MAX_UINT224 = uint224((2 ** 224 - 1));
    uint232 public constant MAX_UINT232 = uint232((2 ** 232 - 1));

    function test_updatePrice() public {
        vm.prank(governance);
        aprCalculator.updatePrice(600, 1);
        assertEq(aprCalculator.latestDailyPrice(), 600);
        assertEq(aprCalculator.pricePerDay(1), 600);
    }

    function test_updateBonusesWithPricesGoingUp() public {
        vm.startPrank(governance);
        for (uint256 i = 0; i < 115; i++) {
            aprCalculator.updatePrice(600 * i, i);
            assertEq(aprCalculator.latestDailyPrice(), 600 * i);
            assertEq(aprCalculator.pricePerDay(i), 600 * i);
        }
        assertEq(aprCalculator.macroFactor(), aprCalculator.MAX_MACRO_FACTOR());
        assertEq(aprCalculator.rsi(), 0);
    }

    function test_updateBonusesWithPricesGoingDown() public {
        vm.startPrank(governance);
        for (uint256 i = 0; i < 166; i++) {
            aprCalculator.updatePrice(500 - (i * 3), i);
            assertEq(aprCalculator.latestDailyPrice(), 500 - (i * 3));
            assertEq(aprCalculator.pricePerDay(i), 500 - (i * 3));
        }
        assertEq(aprCalculator.macroFactor(), 2500);
        assertEq(aprCalculator.rsi(), aprCalculator.MAX_RSI_BONUS());
    }

    function test_updateBonusesWithRandomPrices() public {
        vm.startPrank(governance);
        for (uint256 i = 0; i < 500; i++) {
            uint256 price = generateRandomAmount(i);
            aprCalculator.updatePrice(price, i);
            assertEq(aprCalculator.latestDailyPrice(), price);
            assertEq(aprCalculator.pricePerDay(i), price);
        }
        assert(aprCalculator.rsi() >= 0);
        assert(aprCalculator.rsi() <= aprCalculator.MAX_RSI_BONUS());
        assert(aprCalculator.macroFactor() >= aprCalculator.MIN_MACRO_FACTOR());
        assert(aprCalculator.macroFactor() <= aprCalculator.MAX_MACRO_FACTOR());
    }

    function test_updateBonusesWithRandomBigPrices() public {
        vm.startPrank(governance);
        for (uint256 i = 0; i < 500; i++) {
            uint256 price = generateRandomBigAmount(i);
            aprCalculator.updatePrice(price, i);
            assertEq(aprCalculator.latestDailyPrice(), price);
            assertEq(aprCalculator.pricePerDay(i), price);
        }
        assert(aprCalculator.rsi() >= 0);
        assert(aprCalculator.rsi() <= aprCalculator.MAX_RSI_BONUS());
        assert(aprCalculator.macroFactor() >= aprCalculator.MIN_MACRO_FACTOR());
        assert(aprCalculator.macroFactor() <= aprCalculator.MAX_MACRO_FACTOR());
    }

    function test_mostSutableInputType() public pure {
        assert(MAX_UINT224 < MAX_UINT_DIV_DENOMINATOR_ON_POWER_OF_2); // winner!
        assert(MAX_UINT232 > MAX_UINT_DIV_DENOMINATOR_ON_POWER_OF_2);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                 HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function generateRandomBigAmount(uint256 i) public view returns (uint256) {
        // Generate a pseudo-random number using keccak256 and block.timestamp
        uint256 randomHash = uint256(keccak256(abi.encodePacked(block.timestamp, i)));

        // Ensure the result is less than MAX_UINT_DIV_DENOMINATOR_ON_POWER_OF_2 by applying the modulus
        // During calcuation of bonues, to make sure everything is correnct we mituply calculations by denominator (1e4), up to 2 times
        uint256 randomAmount = randomHash % MAX_UINT_DIV_DENOMINATOR_ON_POWER_OF_2;

        return randomAmount;
    }

    function generateRandomAmount(uint256 i) public view returns (uint256) {
        uint256 randomAmount = generateRandomBigAmount(i);

        if (i % 2 == 0) {
            randomAmount = randomAmount % 1e10;
        } else if (i % 3 == 0) {
            randomAmount = randomAmount % 10;
        } else if (i % 5 == 0) {
            randomAmount = randomAmount % (MAX_UINT_DIV_DENOMINATOR_ON_POWER_OF_2 / 1e12);
        } else if (i % 11 == 0) {
            randomAmount = randomAmount % (MAX_UINT_DIV_DENOMINATOR_ON_POWER_OF_2 / 1e20);
        }

        return randomAmount;
    }
}

/*//////////////////////////////////////////////////////////////////////////
                            INITIALIZATION TEST
//////////////////////////////////////////////////////////////////////////*/

contract TestInitlizedAPR is InitlizeAPR {
    function test_getBaseAPR() public {
        assertEq(aprCalculator.getBaseAPR(), 500);
    }

    function test_getDENOMINATOR() public {
        assertEq(aprCalculator.getDENOMINATOR(), 10000);
    }

    function test_getLatestDailyPrice() public {
        assertEq(aprCalculator.latestDailyPrice(), 500);
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
}
