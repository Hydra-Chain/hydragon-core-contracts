// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@utils/Test.sol";

import {PriceGroupsLib} from "contracts/PriceOracle/libs/PriceGroupsLib.sol";
import {Groups, PriceGroup} from "contracts/PriceOracle/libs/IPriceGroupsLib.sol";

abstract contract EmptyState is Test {
    PriceGroupsMock priceGroupsLib;

    function setUp() public virtual {
        priceGroupsLib = new PriceGroupsMock();
    }
}

abstract contract SingleState is EmptyState {
    function setUp() public virtual override {
        super.setUp();
        priceGroupsLib.insert(address(this), 100);
    }
}

abstract contract MultiState is EmptyState {
    function _fillSingleGroup(uint256[] memory amounts) internal {
        for (uint256 i = 0; i < amounts.length; i++) {
            // Initialize with random values within a broader range
            amounts[i] = (uint256(keccak256(abi.encode(block.timestamp, i))) % 1000) + 100000;
            // Ensure it’s within the original narrow range if needed
            amounts[i] = _bound(amounts[i], 100000, 101000);

            priceGroupsLib.insert(address(this), amounts[i]);
        }

        // Ensure there is at least one group and one validator
        vm.assume(priceGroupsLib.groupsLenghtGetter() == 1);
        vm.assume(priceGroupsLib.voltedValidatorsGetter() == 150);
    }

    function _fillDifferentGroups(uint256[] memory amounts) internal {
        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i] = (uint256(keccak256(abi.encode(block.timestamp, i))) % 1000) + 100000;
            amounts[i] = _bound(amounts[i], 1, 100000);
            priceGroupsLib.insert(address(this), amounts[i]);
        }

        // Ensure there is at least one group and one validator
        vm.assume(priceGroupsLib.groupsLenghtGetter() > 75);
        vm.assume(priceGroupsLib.voltedValidatorsGetter() == 150);
    }

    function _fillWithZero(uint256[] memory amounts) internal {
        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i] = 0;
            priceGroupsLib.insert(address(this), amounts[i]);
        }

        // Ensure there is at least one group and one validator
        vm.assume(priceGroupsLib.groupsLenghtGetter() == 1);
        vm.assume(priceGroupsLib.voltedValidatorsGetter() == 150);
    }

    function _fillWithSpecificNumbers() internal {
        for (uint256 i = 0; i < 10; i++) {
            priceGroupsLib.insert(address(this), 10000);
        }
        for (uint i = 0; i < 10; i++) {
            priceGroupsLib.insert(address(this), 10001);
        }
        for (uint i = 0; i < 10; i++) {
            priceGroupsLib.insert(address(this), 9999);
        }

        // Ensure there is at least one group and one validator
        vm.assume(priceGroupsLib.groupsLenghtGetter() == 1);
        vm.assume(priceGroupsLib.voltedValidatorsGetter() == 30);
    }
}

contract PriceGroupsTest_MultiState is MultiState {
    uint256[] prevousGroupValues;

    function testInsertFullOneGroup() public {
        uint256[] memory amounts = new uint256[](150);
        _fillSingleGroup(amounts);

        PriceGroup[] memory groups = priceGroupsLib.getAllGroups();
        assertEq(groups.length, 1);
        assertEq(groups[0].validators.length, 150);
        for (uint256 i = 0; i < 150; i++) {
            assertEq(groups[0].validators[i], address(this));
        }
        assert(groups[0].sumPrice > 150 * 100000);
        assert(groups[0].sumPrice < 150 * 101000);
    }

    function testInsertDifferentGroups() public {
        uint256[] memory amounts = new uint256[](150);
        _fillDifferentGroups(amounts);

        PriceGroup[] memory groups = priceGroupsLib.getAllGroups();
        assert(groups.length > 75);
        for (uint256 i = 0; i < groups.length; i++) {
            uint256 currentGroupSum = groups[i].sumPrice;
            uint256 currentGroupValidatorLength = groups[i].validators.length;
            uint256 currentGroupValue = currentGroupSum / currentGroupValidatorLength;
            assert(currentGroupValue > 0);
            assert(currentGroupValue < 100000);
            if (i > 0) {
                uint256 len = prevousGroupValues.length;
                for (uint256 j = 0; j < len; j++) {
                    uint256 prevousGroupValue = prevousGroupValues[j];
                    assert(
                        currentGroupValue * 100 < prevousGroupValue * 101 ||
                            currentGroupValue * 100 > prevousGroupValue * 99
                    );
                }
            }
            prevousGroupValues.push(currentGroupValue);
        }
    }

    function testZeroPrice() public {
        uint256[] memory amounts = new uint256[](150);
        _fillWithZero(amounts);

        PriceGroup[] memory groups = priceGroupsLib.getAllGroups();
        assertEq(groups.length, 1);
        assertEq(groups[0].validators.length, 150);
        for (uint256 i = 0; i < 150; i++) {
            assertEq(groups[0].validators[i], address(this));
        }
        assertEq(groups[0].sumPrice, 0);
    }

    function testSpecificNumbers() public {
        _fillWithSpecificNumbers();

        PriceGroup[] memory groups = priceGroupsLib.getAllGroups();
        assertEq(groups.length, 1);
        assertEq(groups[0].validators.length, 30);
        for (uint256 i = 0; i < 30; i++) {
            assertEq(groups[0].validators[i], address(this));
        }
        assertEq(groups[0].sumPrice, 10000 * 30);
    }
}

contract PriceGroupsTest_SingleState is SingleState {
    function testSingleSetUp() public {
        assertEq(priceGroupsLib.voltedValidatorsGetter(), 1);
        assertEq(priceGroupsLib.groupsLenghtGetter(), 1);
        PriceGroup memory currentGroup = priceGroupsLib.priceGroupGetter(0);
        assertEq(currentGroup.sumPrice, 100);
        assertEq(currentGroup.validators.length, 1);
        assertEq(currentGroup.validators[0], address(this));
    }

    function testInsertDifferentGroup() public {
        priceGroupsLib.insert(address(this), 102);
        assertEq(priceGroupsLib.voltedValidatorsGetter(), 2);
        assertEq(priceGroupsLib.groupsLenghtGetter(), 2);
        PriceGroup memory currentGroup = priceGroupsLib.priceGroupGetter(1);
        assertEq(currentGroup.sumPrice, 102);
        assertEq(currentGroup.validators.length, 1);
        assertEq(currentGroup.validators[0], address(this));
    }

    function testInsertInSameGroup() public {
        priceGroupsLib.insert(address(this), 101);
        assertEq(priceGroupsLib.voltedValidatorsGetter(), 2);
        assertEq(priceGroupsLib.groupsLenghtGetter(), 1);
        PriceGroup memory currentGroup = priceGroupsLib.priceGroupGetter(0);
        assertEq(currentGroup.sumPrice, 201);
        assertEq(currentGroup.validators.length, 2);
        assertEq(currentGroup.validators[0], address(this));
        assertEq(currentGroup.validators[1], address(this));
    }

    function testGetAllGroupsSingleSetUp() public {
        PriceGroup[] memory groups = priceGroupsLib.getAllGroups();
        assertEq(groups.length, 1);
        assertEq(groups[0].sumPrice, 100);
        assertEq(groups[0].validators.length, 1);
        assertEq(groups[0].validators[0], address(this));
    }

    function testGetAllGroupsInsertInSameGroup() public {
        priceGroupsLib.insert(address(this), 101);
        PriceGroup[] memory groups = priceGroupsLib.getAllGroups();
        assertEq(groups.length, 1);
        assertEq(groups[0].sumPrice, 201);
        assertEq(groups[0].validators.length, 2);
        assertEq(groups[0].validators[0], address(this));
        assertEq(groups[0].validators[1], address(this));
    }

    function testGetAllGroupsInsertDifferentGroup() public {
        priceGroupsLib.insert(address(this), 102);
        PriceGroup[] memory groups = priceGroupsLib.getAllGroups();
        assertEq(groups.length, 2);
        assertEq(groups[0].sumPrice, 100);
        assertEq(groups[0].validators.length, 1);
        assertEq(groups[0].validators[0], address(this));
        assertEq(groups[1].sumPrice, 102);
        assertEq(groups[1].validators.length, 1);
        assertEq(groups[1].validators[0], address(this));
    }
}

/*//////////////////////////////////////////////////////////////////////////
                                MOCKS
//////////////////////////////////////////////////////////////////////////*/

contract PriceGroupsMock {
    Groups priceGroups;

    function insert(address validator, uint256 price) external {
        PriceGroupsLib.insert(priceGroups, validator, price);
    }

    function getAllGroups() external view returns (PriceGroup[] memory) {
        return PriceGroupsLib.getAllGroups(priceGroups);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                     GETTERS
     //////////////////////////////////////////////////////////////////////////*/

    function voltedValidatorsGetter() external view returns (uint256) {
        return priceGroups.votedValidators;
    }

    function groupsLenghtGetter() external view returns (uint256) {
        return priceGroups.groups.length;
    }

    function priceGroupGetter(uint256 a) external view returns (PriceGroup memory) {
        return priceGroups.groups[a];
    }
}
