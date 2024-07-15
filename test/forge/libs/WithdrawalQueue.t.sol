// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@utils/Test.sol";

import {WithdrawalQueueLib} from "contracts/common/Withdrawal/WithdrawalQueueLib.sol";
import {WithdrawalData, WithdrawalQueue} from "contracts/common/Withdrawal/IWithdrawalQueueLib.sol";

abstract contract EmptyState is Test {
    uint256 constant AMOUNT = 2 ether;
    uint256 constant DURATION = 1 days;

    WithdrawalQueueLibUser withdrawalQueueLibUser;

    function setUp() public virtual {
        withdrawalQueueLibUser = new WithdrawalQueueLibUser();
    }
}

contract WithdrawalQueueTest_EmptyState is EmptyState {
    function testCannotAppend_ZeroAmount() public {
        vm.expectRevert(stdError.assertionError);
        withdrawalQueueLibUser.append(0, 0);
    }

    function testAppend() public {
        withdrawalQueueLibUser.append(AMOUNT, block.timestamp + DURATION);

        assertEq(withdrawalQueueLibUser.headGetter(), 0);
        assertEq(withdrawalQueueLibUser.tailGetter(), 1);
        assertEq(
            withdrawalQueueLibUser.withdrawalsGetter(0),
            WithdrawalData({amount: AMOUNT, time: block.timestamp + DURATION})
        );
    }
}

abstract contract SingleState is EmptyState {
    function setUp() public virtual override {
        super.setUp();
        withdrawalQueueLibUser.append(AMOUNT, block.timestamp + DURATION);
    }
}

contract WithdrawalQueueTest_SingleState is SingleState {
    function testCannotAppend_CurrentTime() public {
        vm.expectRevert(stdError.assertionError);
        withdrawalQueueLibUser.append(AMOUNT, block.timestamp);
    }

    function testCannotAppend_OldTime() public {
        vm.expectRevert(stdError.assertionError);
        withdrawalQueueLibUser.append(AMOUNT, block.timestamp - 1);
    }

    function testAppend_SameTime() public {
        withdrawalQueueLibUser.append(AMOUNT, block.timestamp + DURATION);

        assertEq(withdrawalQueueLibUser.headGetter(), 0);
        assertEq(withdrawalQueueLibUser.tailGetter(), 1);
        assertEq(withdrawalQueueLibUser.withdrawalsGetter(0), WithdrawalData(AMOUNT * 2, block.timestamp + DURATION));
    }

    function testAppend_LaterTime() public {
        withdrawalQueueLibUser.append(AMOUNT / 2, block.timestamp + DURATION * 2);

        assertEq(withdrawalQueueLibUser.headGetter(), 0);
        assertEq(withdrawalQueueLibUser.tailGetter(), 2);
        assertEq(
            withdrawalQueueLibUser.withdrawalsGetter(1),
            WithdrawalData(AMOUNT / 2, block.timestamp + DURATION * 2)
        );
    }
}

abstract contract MultipleState is SingleState {
    function setUp() public virtual override {
        // start with empty queue
        withdrawalQueueLibUser = new WithdrawalQueueLibUser();
    }

    /// @notice Fill queue and randomize head
    /// @dev Use in fuzz tests
    function _fillQueue(uint128[] memory amounts) internal {
        for (uint256 i; i < amounts.length; ) {
            uint256 amount = amounts[i];
            if (amount > 0) withdrawalQueueLibUser.append(amount, block.timestamp + DURATION + i);
            unchecked {
                ++i;
            }
        }
        vm.assume(withdrawalQueueLibUser.tailGetter() > 0);
        withdrawalQueueLibUser.headSetter(type(uint256).max % withdrawalQueueLibUser.tailGetter());
    }
}

contract WithdrawalQueue_MultipleState is MultipleState {
    function testLength(uint128[] memory amounts) public {
        _fillQueue(amounts);

        assertEq(
            withdrawalQueueLibUser.length(),
            withdrawalQueueLibUser.tailGetter() - withdrawalQueueLibUser.headGetter()
        );
    }

    function testWithdrawable(uint128[] memory amounts, uint256 currentTime) public {
        _fillQueue(amounts);
        uint256 expectedAmount;
        uint256 expectedNewHead;
        currentTime = bound(currentTime, withdrawalQueueLibUser.headGetter(), withdrawalQueueLibUser.tailGetter() - 1);
        // calculate amount and newHead
        expectedNewHead = withdrawalQueueLibUser.headGetter();
        WithdrawalData memory withdrawal = withdrawalQueueLibUser.withdrawalsGetter(expectedNewHead);
        while (expectedNewHead < withdrawalQueueLibUser.tailGetter() && withdrawal.time <= currentTime) {
            expectedAmount += withdrawal.amount;
            ++expectedNewHead;

            withdrawal = withdrawalQueueLibUser.withdrawalsGetter(expectedNewHead);
        }

        (uint256 amount, uint256 newHead) = withdrawalQueueLibUser.withdrawable();
        assertEq(amount, expectedAmount, "Amount");
        assertEq(newHead, expectedNewHead, "New head");
    }

    function testPending(uint128[] memory amounts, uint256 currentTime) public {
        _fillQueue(amounts);
        uint256 expectedAmount;
        currentTime = bound(currentTime, withdrawalQueueLibUser.headGetter(), withdrawalQueueLibUser.tailGetter() - 1);
        // calculate amount
        uint256 headCursor = withdrawalQueueLibUser.headGetter();
        WithdrawalData memory withdrawal = withdrawalQueueLibUser.withdrawalsGetter(headCursor);
        while (headCursor < withdrawalQueueLibUser.tailGetter()) {
            if (withdrawal.time > currentTime) expectedAmount += withdrawal.amount;
            withdrawal = withdrawalQueueLibUser.withdrawalsGetter(++headCursor);
        }

        assertEq(withdrawalQueueLibUser.pending(), expectedAmount);
    }

    function testPending_HeadZero() public {
        withdrawalQueueLibUser.append(1 ether, block.timestamp + DURATION);

        // should break and not underflow
        assertEq(withdrawalQueueLibUser.pending(), 1 ether);
    }
}

/*//////////////////////////////////////////////////////////////////////////
                                 MOCKS
 //////////////////////////////////////////////////////////////////////////*/

contract WithdrawalQueueLibUser {
    WithdrawalQueue queue;

    function append(uint256 amount, uint256 time) external {
        WithdrawalQueueLib.append(queue, amount, time);
    }

    function length() external view returns (uint256) {
        uint256 r = WithdrawalQueueLib.length(queue);
        return r;
    }

    function withdrawable() external view returns (uint256, uint256) {
        (uint256 a, uint256 b) = WithdrawalQueueLib.withdrawable(queue);
        return (a, b);
    }

    function pending() external view returns (uint256 amount) {
        uint256 r = WithdrawalQueueLib.pending(queue);
        return r;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                         GETTERS
     //////////////////////////////////////////////////////////////////////////*/

    function headGetter() external view returns (uint256) {
        return queue.head;
    }

    function tailGetter() external view returns (uint256) {
        return queue.tail;
    }

    function withdrawalsGetter(uint256 a) external view returns (WithdrawalData memory) {
        return queue.withdrawals[a];
    }

    /*//////////////////////////////////////////////////////////////////////////
                                         SETTERS
     //////////////////////////////////////////////////////////////////////////*/

    function headSetter(uint256 a) external {
        queue.head = a;
    }
}
