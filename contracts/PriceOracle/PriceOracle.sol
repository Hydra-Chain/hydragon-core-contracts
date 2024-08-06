// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Unauthorized} from "../common/Errors.sol";
import {System} from "../common/System/System.sol";
import {HydraChainConnector} from "../HydraChain/HydraChainConnector.sol";
import {APRCalculatorConnector} from "../APRCalculator/APRCalculatorConnector.sol";
import {IPriceOracle} from "./IPriceOracle.sol";

/**
 * @title PriceOracle
 * @dev This contract will be responsible for the price updates.
 * Active validators will be able to vote and agree on the price.
 */
contract PriceOracle is IPriceOracle, System, Initializable, HydraChainConnector, APRCalculatorConnector {
    mapping(address => uint256) public validatorVotedForDay;
    mapping(uint256 => uint256[]) public priceVotesForDay;

    // _______________ Initializer _______________

    function initialize(address _hydraChainAddr, address _aprCalculatorAddr) external initializer onlySystemCall {
        __HydraChainConnector_init(_hydraChainAddr);
        __APRCalculatorConnector_init(_aprCalculatorAddr);
        _initialize();
    }

    function _initialize() private onlyInitializing {}

    // _______________ External functions _______________

    function vote(uint256 _price) external {
        if (hydraChainContract.isValidatorActive(msg.sender) == false) {
            revert Unauthorized("ONLY_ACTIVE_VALIDATOR");
        }

        _vote(_price);
    }

    // _______________ Internal functions _______________

    function _vote(uint256 _price) internal {
        uint256 day = _getCurrentDay();
        if (validatorVotedForDay[msg.sender] == day) {
            revert Unauthorized("ALREADY_VOTED");
        }

        validatorVotedForDay[msg.sender] = day;
        priceVotesForDay[day].push(_price);

        if (priceVotesForDay[day].length != 4 || /** quorum < 0.61 */ true) {
            return;
        } else {
            _updatePrice(day);
        }

        aprCalculatorContract.quotePrice(_price);
    }

    // _______________ Private functions _______________

    function _updatePrice(uint256 _day) private {
        uint256[] memory prices = priceVotesForDay[_day];
        uint256 sum = 0;
        for (uint256 i = 0; i < prices.length; i++) {
            sum += prices[i];
        }

        uint256 price = sum / prices.length;
        if (price * 100 > prices[0] * 101 || price * 100 < prices[0] * 99) {
            revert Unauthorized("PRICE_MISMATCH");
        }

        aprCalculatorContract.quotePrice(price);
    }

    function _getCurrentDay() private view returns (uint256) {
        return block.timestamp / 1 days;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
