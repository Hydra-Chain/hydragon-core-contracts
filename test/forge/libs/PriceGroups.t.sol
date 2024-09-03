// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@utils/Test.sol";

import {PriceGroupsLib} from "contracts/PriceOracle/libs/PriceGroupsLib.sol";
import {Groups, PriceGroup} from "contracts/PriceOracle/libs/IPriceGroupsLib.sol";

contract PriceGroupsTest is Test {
    PriceGroupsMock private priceGroupsLib;

    function setUp() public {
        priceGroupsLib = new PriceGroupsMock();
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
}





