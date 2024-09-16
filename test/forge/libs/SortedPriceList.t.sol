// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@utils/Test.sol";

import {List, Node, ValidatorPrice} from "contracts/PriceOracle/libs/ISortedPriceList.sol";
import {SortedPriceList} from "contracts/PriceOracle/libs/SortedPriceList.sol";

abstract contract EmptyState is Test {
    SortedPriceListMock sortedPriceList;

    function setUp() public virtual {
        sortedPriceList = new SortedPriceListMock();
    }
}

abstract contract SingleState is EmptyState {
    function setUp() public virtual override {
        super.setUp();
        sortedPriceList.insert(address(this), 100);
    }
}

abstract contract MultiState is EmptyState {
    function _fillPriceWithinRange(uint256[] memory amounts) internal {
        for (uint256 i = 0; i < amounts.length; i++) {
            // Initialize with random values within a broader range
            amounts[i] = (uint256(keccak256(abi.encode(block.timestamp, i))) % 1000) + 100000;
            // Ensure it’s within the original narrow range if needed
            amounts[i] = _bound(amounts[i], 100000, 101000);
            address randomAddress = vm.addr(uint256(keccak256(abi.encode(i))));
            sortedPriceList.insert(randomAddress, amounts[i]);
        }

        // Ensure the total number of validators is 150
        vm.assume(sortedPriceList.headGetter() != address(0));
        vm.assume(sortedPriceList.getTotalValidators() == 150);
    }

    function _fillWithDifferentPrices(uint256[] memory amounts) internal {
        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i] = (uint256(keccak256(abi.encode(block.timestamp, i))) % 1000) + 100000;
            amounts[i] = _bound(amounts[i], 1, 100000);
            address randomAddress = vm.addr(uint256(keccak256(abi.encode(i))));
            sortedPriceList.insert(randomAddress, amounts[i]);
        }

        // Ensure the total number of validators is 150
        vm.assume(sortedPriceList.headGetter() != address(0));
        vm.assume(sortedPriceList.getTotalValidators() == 150);
    }

    function _fillWithSpecificNumbers() internal {
        for (uint256 i = 0; i < 10; i++) {
            address randomAddress = vm.addr(uint256(keccak256(abi.encode(i))));
            sortedPriceList.insert(randomAddress, 10000);
        }
        for (uint i = 10; i < 20; i++) {
            address randomAddress = vm.addr(uint256(keccak256(abi.encode(i))));
            sortedPriceList.insert(randomAddress, 10001);
        }
        for (uint i = 20; i < 30; i++) {
            address randomAddress = vm.addr(uint256(keccak256(abi.encode(i))));
            sortedPriceList.insert(randomAddress, 9999);
        }

        // Ensure the total number of validators is 30
        vm.assume(sortedPriceList.headGetter() != address(0));
        vm.assume(sortedPriceList.getTotalValidators() == 30);
    }
}

contract SortedPriceListTest_MultiState is MultiState {
    uint256[] prevousGroupValues;

    function testInsertInSameRange() public {
        uint256[] memory amounts = new uint256[](150);
        _fillPriceWithinRange(amounts);

        ValidatorPrice[] memory list = sortedPriceList.getAllVotes();
        assertEq(list.length, 150);
        uint256 lastPrice = 0;
        uint256 sumPrice;
        for (uint256 i = 0; i < 150; i++) {
            assert(list[i].validator != address(0));
            assert(list[i].price >= lastPrice);
            lastPrice = list[i].price;
            sumPrice += list[i].price;
            assert(sumPrice / (i + 1) >= 100000);
            assert(sumPrice / (i + 1) <= 101000);
        }
    }

    function testInsertDifferentPrices() public {
        uint256[] memory amounts = new uint256[](150);
        _fillWithDifferentPrices(amounts);

        ValidatorPrice[] memory list = sortedPriceList.getAllVotes();
        assert(list.length == 150);
        uint256 lastPrice = 0;
        for (uint256 i = 0; i < list.length; i++) {
            assert(list[i].validator != address(0));
            assert(list[i].price >= lastPrice);
            lastPrice = list[i].price;
        }
    }

    function testSpecificNumbers() public {
        _fillWithSpecificNumbers();

        ValidatorPrice[] memory list = sortedPriceList.getAllVotes();
        assertEq(list.length, 30);
        for (uint256 i = 0; i < 10; i++) {
            assertEq(list[i].price, 9999);
        }
        for (uint256 i = 10; i < 20; i++) {
            assertEq(list[i].price, 10000);
        }
        for (uint256 i = 20; i < 30; i++) {
            assertEq(list[i].price, 10001);
        }
    }
}

contract ValidatorPricesTest_SingleState is SingleState {
    function testSingleSetUp() public {
        assertEq(sortedPriceList.getTotalValidators(), 1);
        ValidatorPrice[] memory list = sortedPriceList.getAllVotes();
        assertEq(list[0].validator, address(this));
        assertEq(list[0].price, 100);
        assertEq(list.length, 1);
    }

    function testInsertSmallerPrice() public {
        address headBefore = sortedPriceList.headGetter();
        assertEq(headBefore, address(this));
        sortedPriceList.insert(address(1), 99);
        assertEq(sortedPriceList.getTotalValidators(), 2);
        ValidatorPrice[] memory list = sortedPriceList.getAllVotes();
        assertEq(list.length, 2);
        assertEq(list[0].validator, address(1));
        assertEq(list[0].price, 99);
        assertEq(list[1].validator, address(this));
        assertEq(list[1].price, 100);
        address headAfter = sortedPriceList.headGetter();
        assertEq(headAfter, address(1));
    }

    function testInsertBiggerPrice() public {
        sortedPriceList.insert(address(1), 101);
        address headBefore = sortedPriceList.headGetter();
        assertEq(headBefore, address(this));
        assertEq(sortedPriceList.getTotalValidators(), 2);
        ValidatorPrice[] memory list = sortedPriceList.getAllVotes();
        assertEq(list.length, 2);
        assertEq(list[0].validator, address(this));
        assertEq(list[0].price, 100);
        assertEq(list[1].validator, address(1));
        assertEq(list[1].price, 101);
        address headAfter = sortedPriceList.headGetter();
        assertEq(headAfter, address(this));
    }

    function testFailInsertSameFromZeroAddress() public {
        sortedPriceList.insert(address(0), 100);
    }
}

/*//////////////////////////////////////////////////////////////////////////
                                MOCKS
//////////////////////////////////////////////////////////////////////////*/

contract SortedPriceListMock {
    List priceList;

    function insert(address validator, uint256 price) external {
        SortedPriceList.insert(priceList, validator, price);
    }

    function getAllVotes() public view returns (ValidatorPrice[] memory) {
        return SortedPriceList.getAll(priceList);
    }

    function getTotalValidators() external view returns (uint256) {
        return priceList.size;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                     GETTERS
     //////////////////////////////////////////////////////////////////////////*/

    function headGetter() external view returns (address) {
        return priceList.head;
    }

    function validatorPriceGetter(address validator) external view returns (uint256) {
        return priceList.nodes[validator].price;
    }

    function nextGetter(address validator) external view returns (address) {
        return priceList.nodes[validator].next;
    }
}
