// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../common/System/System.sol";
import {Governed} from "../common/Governed/Governed.sol";

contract HydraVault is Initializable, System, Governed {
    event FeeReceived(address indexed from, uint256 amount);
    event FeesRelocated(bool success, bytes data);

    // _______________ Initializer _______________

    function initialize(address governance) public initializer onlySystemCall {
        __Governed_init(governance);
    }

    // _______________ External functions _______________

    /**
     * @notice Generic method that will be used to transfer the generated fees to another contract
     * @param contractAddress The address of the contract that will be called
     * @param callData The encoded function with its signature and parameters, if any
     */
    function relocateFees(address contractAddress, bytes memory callData) external onlyGovernance {
        (bool success, bytes memory data) = contractAddress.call{value: address(this).balance}(callData);

        emit FeesRelocated(success, data);
    }

    receive() external payable {
        emit FeeReceived(msg.sender, msg.value);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
