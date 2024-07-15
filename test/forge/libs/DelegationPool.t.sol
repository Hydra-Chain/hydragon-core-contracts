// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@utils/Test.sol";

import {NoTokensDelegated, DelegationPool, DelegationPoolLib} from "contracts/HydraDelegation/DelegationPoolLib.sol";
import {SafeMathInt, SafeMathUint} from "contracts/common/libs/SafeMathInt.sol";

contract DelegationPoolTest is Test {
    using SafeMathUint for uint256;
    using SafeMathInt for int256;

    uint256 constant MAGNITUDE = 1e18;

    address accountA;
    address accountB;

    DelegationPoolLibUser delegationPoolLibUser;

    function setUp() public {
        accountA = makeAddr("accountA");
        accountB = makeAddr("accountB");
        delegationPoolLibUser = new DelegationPoolLibUser();
    }

    function testDeposit(uint96[2] memory amounts) public {
        delegationPoolLibUser.deposit(accountA, amounts[0]);
        delegationPoolLibUser.deposit(accountB, amounts[1]);

        assertEq(delegationPoolLibUser.balancesGetter(accountA), amounts[0], "Balance A");
        assertEq(delegationPoolLibUser.balancesGetter(accountB), amounts[1], "Balance B");
        assertEq(delegationPoolLibUser.supplyGetter(), uint256(amounts[0]) + amounts[1], "Supply");
        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountA), 0, "Correction A");
        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountB), 0, "Correction B");
    }

    function testBalanceOf() public {
        delegationPoolLibUser.deposit(accountA, 1 ether);
        delegationPoolLibUser.deposit(accountB, 3 ether);

        assertEq(delegationPoolLibUser.balanceOf(accountA), 1 ether);
        assertEq(delegationPoolLibUser.balanceOf(accountB), 3 ether);
    }

    function testWithdraw() public {
        delegationPoolLibUser.deposit(accountA, 1 ether);
        delegationPoolLibUser.deposit(accountB, 3 ether);
        delegationPoolLibUser.distributeReward(8);

        delegationPoolLibUser.withdraw(accountB, 1 ether);

        assertEq(delegationPoolLibUser.balancesGetter(accountB), 2 ether, "Balance");
        assertEq(delegationPoolLibUser.supplyGetter(), 3 ether, "Supply");
        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountB), 2 ether, "Correction");
    }

    function testDistributeReward_AmountZero() public {
        vm.record();

        delegationPoolLibUser.distributeReward(0);

        // did not write to storage
        (, bytes32[] memory writes) = (vm.accesses(address(this)));
        assertEq(writes.length, 0);
    }

    function testCannotDistributeReward_NoTokensDelegated() public {
        vm.expectRevert(abi.encodeWithSelector(NoTokensDelegated.selector, (delegationPoolLibUser.validatorGetter())));
        delegationPoolLibUser.distributeReward(1);
    }

    function testDistributeReward(uint96[2] memory amounts, uint96 reward) public {
        vm.assume(amounts[0] > 0);
        vm.assume(amounts[1] > 0);
        vm.assume(reward > 0);
        delegationPoolLibUser.deposit(accountA, amounts[0]);
        delegationPoolLibUser.deposit(accountB, amounts[1]);

        delegationPoolLibUser.distributeReward(reward);

        assertEq(
            delegationPoolLibUser.magnifiedRewardPerShareGetter(),
            (reward * MAGNITUDE) / (uint256(amounts[0]) + amounts[1])
        );
    }

    function testDeposit_More(uint96[2] memory amounts, uint96 reward) public {
        vm.assume(amounts[0] > 0);
        vm.assume(amounts[1] > 0);
        vm.assume(reward > 0);
        delegationPoolLibUser.deposit(accountA, amounts[0]);
        delegationPoolLibUser.distributeReward(reward);

        delegationPoolLibUser.deposit(accountA, amounts[1]);

        assertEq(delegationPoolLibUser.balancesGetter(accountA), uint256(amounts[0]) + amounts[1], "Balance A");
        assertEq(delegationPoolLibUser.supplyGetter(), uint256(amounts[0]) + amounts[1], "Supply");
        assertEq(
            delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountA),
            -1 * (delegationPoolLibUser.magnifiedRewardPerShareGetter() * amounts[1]).toInt256Safe(),
            "Correction A"
        );
    }

    function testTotalRewardsEarned() public {
        delegationPoolLibUser.deposit(accountA, 2 ether);
        delegationPoolLibUser.deposit(accountB, 1 ether);
        delegationPoolLibUser.distributeReward(12 ether);

        assertEq(delegationPoolLibUser.totalRewardsEarned(accountA), 8 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountB), 4 ether);

        address accountC = makeAddr("accountC");
        delegationPoolLibUser.deposit(accountC, 17 ether);
        delegationPoolLibUser.distributeReward(10 ether);

        assertEq(delegationPoolLibUser.totalRewardsEarned(accountA), 9 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountB), 4.5 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountC), 8.5 ether);

        delegationPoolLibUser.withdraw(accountC, 17 ether);
        delegationPoolLibUser.distributeReward(2 ether);

        assertEq(delegationPoolLibUser.totalRewardsEarned(accountA), 10.333333333333333332 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountB), 5.166666666666666666 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountC), 8.5 ether);

        delegationPoolLibUser.deposit(accountC, 1 ether);
        delegationPoolLibUser.distributeReward(4 ether);

        assertEq(delegationPoolLibUser.totalRewardsEarned(accountA), 12.333333333333333332 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountB), 6.166666666666666666 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountC), 9.5 ether);
    }

    function testTotalRewardsEarned(uint96[3] memory amounts, uint96[2] memory rewards) public {
        vm.assume(amounts[0] > 0);
        vm.assume(amounts[1] > 0);
        vm.assume(amounts[2] > 0);
        vm.assume(rewards[0] > 0);
        vm.assume(rewards[1] > 0);

        delegationPoolLibUser.deposit(accountA, amounts[0]);
        delegationPoolLibUser.deposit(accountB, amounts[1]);
        delegationPoolLibUser.distributeReward(rewards[0]);

        assertEq(
            delegationPoolLibUser.totalRewardsEarned(accountA),
            (delegationPoolLibUser.magnifiedRewardPerShareGetter() * amounts[0]) / MAGNITUDE
        );
        assertEq(
            delegationPoolLibUser.totalRewardsEarned(accountB),
            (delegationPoolLibUser.magnifiedRewardPerShareGetter() * amounts[1]) / MAGNITUDE
        );

        address accountC = makeAddr("accountC");
        delegationPoolLibUser.deposit(accountC, amounts[2]);
        delegationPoolLibUser.distributeReward(rewards[1]);

        assertEq(
            delegationPoolLibUser.totalRewardsEarned(accountA),
            (delegationPoolLibUser.magnifiedRewardPerShareGetter() * amounts[0]) / MAGNITUDE
        );
        assertEq(
            delegationPoolLibUser.totalRewardsEarned(accountB),
            (delegationPoolLibUser.magnifiedRewardPerShareGetter() * amounts[1]) / MAGNITUDE
        );
        assertEq(
            delegationPoolLibUser.totalRewardsEarned(accountC),
            (
                ((delegationPoolLibUser.magnifiedRewardPerShareGetter() * amounts[2]).toInt256Safe() +
                    delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountC))
            ).toUint256Safe() / MAGNITUDE
        );
    }

    function testClaimRewards() public {
        delegationPoolLibUser.deposit(accountA, 1);
        delegationPoolLibUser.distributeReward(1 ether);

        delegationPoolLibUser.claimRewards(accountA);

        assertEq(delegationPoolLibUser.claimedRewardsGetter(accountA), 1 ether);

        delegationPoolLibUser.distributeReward(2 ether);

        delegationPoolLibUser.claimRewards(accountA);

        assertEq(delegationPoolLibUser.claimedRewardsGetter(accountA), 3 ether);
    }

    function testClaimableRewards() public {
        delegationPoolLibUser.deposit(accountA, 1);
        delegationPoolLibUser.distributeReward(1 ether);

        assertEq(delegationPoolLibUser.claimableRewards(accountA), 1 ether);

        delegationPoolLibUser.claimRewards(accountA);

        assertEq(delegationPoolLibUser.claimableRewards(accountA), 0 ether);

        delegationPoolLibUser.distributeReward(3 ether);

        assertEq(delegationPoolLibUser.claimableRewards(accountA), 3 ether);
    }
}

/*//////////////////////////////////////////////////////////////////////////
                                MOCKS
//////////////////////////////////////////////////////////////////////////*/

contract DelegationPoolLibUser {
    DelegationPool pool;

    constructor() {
        pool.staker = address(this);
    }

    function distributeReward(uint256 amount) external {
        DelegationPoolLib.distributeReward(pool, amount);
    }

    function deposit(address account, uint256 amount) external {
        DelegationPoolLib.deposit(pool, account, amount);
    }

    function withdraw(address account, uint256 amount) external {
        DelegationPoolLib.withdraw(pool, account, amount);
    }

    function claimRewards(address account) external returns (uint256) {
        uint256 r = DelegationPoolLib.claimRewards(pool, account);
        return r;
    }

    function balanceOf(address account) external view returns (uint256) {
        uint256 r = DelegationPoolLib.balanceOf(pool, account);
        return r;
    }

    function totalRewardsEarned(address account) external view returns (uint256) {
        uint256 r = DelegationPoolLib.totalRewardsEarned(pool, account);
        return r;
    }

    function claimableRewards(address account) external view returns (uint256) {
        uint256 r = DelegationPoolLib.claimableRewards(pool, account);
        return r;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                        GETTERS
    //////////////////////////////////////////////////////////////////////////*/

    function supplyGetter() external view returns (uint256) {
        return pool.supply;
    }

    function magnifiedRewardPerShareGetter() external view returns (uint256) {
        return pool.magnifiedRewardPerShare;
    }

    function validatorGetter() external view returns (address) {
        return pool.staker;
    }

    function magnifiedRewardCorrectionsGetter(address a) external view returns (int256) {
        return pool.magnifiedRewardCorrections[a];
    }

    function claimedRewardsGetter(address a) external view returns (uint256) {
        return pool.claimedRewards[a];
    }

    function balancesGetter(address a) external view returns (uint256) {
        return pool.balances[a];
    }
}
