// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./../../IValidatorSet.sol";
import "./../../ValidatorSetBase.sol";

/**
 * @title BalanceState
 * @notice Contracts that keeps the state of the staker's balance. It works like a very simple and minimalistic ERC20 token.
 * It is a temporary solution until a more complex governance mechanism is implemented.
 */
abstract contract BalanceState is ValidatorSetBase {
    uint256 public totalBalance;
    mapping(address => uint256) public stakeBalances;

    function balanceOf(address account) public view virtual returns (uint256) {
        return stakeBalances[account];
    }

    function totalSupply() public view virtual returns (uint256) {
        return totalBalance;
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`.
     */
    function _increaseAccountBalance(address account, uint256 value) internal {
        require(account != address(0), "ZERO_ADDRESS");

        stakeBalances[account] += value;
        totalBalance += value;
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, decreasing the balance.
     */
    function _decreaseAccountBalance(address account, uint256 value) internal {
        require(account != address(0), "ZERO_ADDRESS");
        require(stakeBalances[account] - value >= 0, "LOW_BALANCE");

        stakeBalances[account] -= value;
        totalBalance -= value;

        if (stakeBalances[account] == 0) {
            activeValidatorsCount--;
        }
    }
}
