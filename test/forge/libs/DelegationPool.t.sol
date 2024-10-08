// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@utils/Test.sol";

import {DelegationPool, DelegationPoolDelegatorParams} from "contracts/HydraDelegation/modules/DelegationPoolLib/IDelegationPoolLib.sol";
import {DelegationPoolLib} from "contracts/HydraDelegation/modules/DelegationPoolLib/DelegationPoolLib.sol";
import {SafeMathInt} from "contracts/common/libs/SafeMathInt.sol";
import {SafeMathUint} from "contracts/common/libs/SafeMathUint.sol";

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

    function testDepositWithHistoricalData(uint96[2] memory amounts, uint96 epochId) public {
        delegationPoolLibUser.depositWithHistoricalData(accountA, amounts[0], epochId);
        delegationPoolLibUser.depositWithHistoricalData(accountB, amounts[1], epochId);

        assertEq(delegationPoolLibUser.balancesGetter(accountA), amounts[0], "Balance A after deposit");
        assertEq(delegationPoolLibUser.balancesGetter(accountB), amounts[1], "Balance B after deposit");
        assertEq(delegationPoolLibUser.supplyGetter(), uint256(amounts[0]) + amounts[1], "Total supply after deposits");
        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountA), 0, "Correction A after deposit");
        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountB), 0, "Correction B after deposit");

        (uint256 balanceA, int256 correctionA, uint256 epochA) = delegationPoolLibUser.getDelegatorHistoryParams(
            accountA,
            0
        );
        assertEq(balanceA, amounts[0], "Historical balance A");
        assertEq(correctionA, 0, "Historical correction A");
        assertEq(epochA, epochId, "Historical epoch A");

        (uint256 balanceB, int256 correctionB, uint256 epochB) = delegationPoolLibUser.getDelegatorHistoryParams(
            accountB,
            0
        );
        assertEq(balanceB, amounts[1], "Historical balance B");
        assertEq(correctionB, 0, "Historical correction B");
        assertEq(epochB, epochId, "Historical epoch B");
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
        delegationPoolLibUser.distributeReward(8, 1);

        delegationPoolLibUser.withdraw(accountB, 1 ether);

        assertEq(delegationPoolLibUser.balancesGetter(accountB), 2 ether, "Balance");
        assertEq(delegationPoolLibUser.supplyGetter(), 3 ether, "Supply");
        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountB), 2 ether, "Correction");
    }

    function testWithdrawWithHistoricalData(uint96[2] memory amounts, uint96 epochIdInput) public {
        vm.assume(amounts[0] > 0);
        vm.assume(amounts[1] > 0);

        uint256 epochId = uint256(epochIdInput);

        delegationPoolLibUser.depositWithHistoricalData(accountA, amounts[0], epochId);
        delegationPoolLibUser.depositWithHistoricalData(accountB, amounts[1], epochId);

        delegationPoolLibUser.withdrawWithHistoricalData(accountA, amounts[0], epochId + 1);
        delegationPoolLibUser.withdrawWithHistoricalData(accountB, amounts[1], epochId + 1);

        assertEq(delegationPoolLibUser.balancesGetter(accountA), 0, "Balance A after withdrawal");
        assertEq(delegationPoolLibUser.balancesGetter(accountB), 0, "Balance B after withdrawal");
        assertEq(delegationPoolLibUser.supplyGetter(), 0, "Total supply after withdrawals");

        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountA), 0, "Correction A after withdrawal");
        assertEq(delegationPoolLibUser.magnifiedRewardCorrectionsGetter(accountB), 0, "Correction B after withdrawal");

        (uint256 balanceA, int256 correctionA, uint256 epochA) = delegationPoolLibUser.getDelegatorHistoryParams(
            accountA,
            1
        );

        assertEq(balanceA, 0, "Historical balance A after withdrawal");
        assertEq(correctionA, 0, "Historical correction A after withdrawal");
        assertEq(epochA, epochId + 1, "Historical epoch A after withdrawal");

        (uint256 balanceB, int256 correctionB, uint256 epochB) = delegationPoolLibUser.getDelegatorHistoryParams(
            accountB,
            1
        );
        assertEq(balanceB, 0, "Historical balance B after withdrawal");
        assertEq(correctionB, 0, "Historical correction B after withdrawal");
        assertEq(epochB, epochId + 1, "Historical epoch B after withdrawal");
    }

    function testDistributeReward_AmountZero() public {
        vm.record();

        delegationPoolLibUser.distributeReward(0, 1);

        // did not write to storage
        (, bytes32[] memory writes) = (vm.accesses(address(this)));
        assertEq(writes.length, 0);
    }

    // In our version of the contracts we cannot hit this case
    // function testCannotDistributeReward_NoTokensDelegated() public {
    //     vm.expectRevert(abi.encodeWithSelector(NoTokensDelegated.selector, (address(delegationPoolLibUser))));
    //     delegationPoolLibUser.distributeReward(1);
    // }

    function testDistributeReward_EmptyPool(uint96 amount, uint96 reward) public {
        if (amount <= 1 ether || reward <= 10 ether) {
            return;
        }

        delegationPoolLibUser.deposit(accountA, amount);
        delegationPoolLibUser.distributeReward(reward, 1);

        delegationPoolLibUser.withdraw(accountA, amount);

        assertEq(delegationPoolLibUser.virtualSupplyGetter(), 0, "VirtualSupply");

        vm.record();

        delegationPoolLibUser.distributeReward(5, 1);

        // did not write to storage
        (, bytes32[] memory writes) = (vm.accesses(address(this)));
        assertEq(writes.length, 0);
    }

    function testDistributeReward(uint96[2] memory amounts, uint96 reward) public {
        vm.assume(amounts[0] > 0);
        vm.assume(amounts[1] > 0);
        vm.assume(reward > 0);
        delegationPoolLibUser.deposit(accountA, amounts[0]);
        delegationPoolLibUser.deposit(accountB, amounts[1]);

        delegationPoolLibUser.distributeReward(reward, 1);

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
        delegationPoolLibUser.distributeReward(reward, 1);

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
        delegationPoolLibUser.distributeReward(12 ether, 1);

        assertEq(delegationPoolLibUser.totalRewardsEarned(accountA), 8 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountB), 4 ether);

        address accountC = makeAddr("accountC");
        delegationPoolLibUser.deposit(accountC, 17 ether);
        delegationPoolLibUser.distributeReward(10 ether, 2);

        assertEq(delegationPoolLibUser.totalRewardsEarned(accountA), 9 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountB), 4.5 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountC), 8.5 ether);

        delegationPoolLibUser.withdraw(accountC, 17 ether);
        delegationPoolLibUser.distributeReward(2 ether, 3);

        assertEq(delegationPoolLibUser.totalRewardsEarned(accountA), 10.333333333333333332 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountB), 5.166666666666666666 ether);
        assertEq(delegationPoolLibUser.totalRewardsEarned(accountC), 8.5 ether);

        delegationPoolLibUser.deposit(accountC, 1 ether);
        delegationPoolLibUser.distributeReward(4 ether, 4);

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
        delegationPoolLibUser.distributeReward(rewards[0], 1);

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
        delegationPoolLibUser.distributeReward(rewards[1], 2);

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
        delegationPoolLibUser.distributeReward(1 ether, 1);

        delegationPoolLibUser.claimRewards(accountA);

        assertEq(delegationPoolLibUser.claimedRewardsGetter(accountA), 1 ether);

        delegationPoolLibUser.distributeReward(2 ether, 2);

        delegationPoolLibUser.claimRewards(accountA);

        assertEq(delegationPoolLibUser.claimedRewardsGetter(accountA), 3 ether);
    }

    function testClaimableRewards() public {
        delegationPoolLibUser.deposit(accountA, 1);
        delegationPoolLibUser.distributeReward(1 ether, 1);

        assertEq(delegationPoolLibUser.claimableRewards(accountA), 1 ether);

        delegationPoolLibUser.claimRewards(accountA);

        assertEq(delegationPoolLibUser.claimableRewards(accountA), 0 ether);

        delegationPoolLibUser.distributeReward(3 ether, 2);

        assertEq(delegationPoolLibUser.claimableRewards(accountA), 3 ether);
    }
}

/*//////////////////////////////////////////////////////////////////////////
                                MOCKS
//////////////////////////////////////////////////////////////////////////*/

contract DelegationPoolLibUser {
    DelegationPool pool;

    function distributeReward(uint256 amount, uint256 epochId) external {
        DelegationPoolLib.distributeReward(pool, amount, epochId);
    }

    function deposit(address account, uint256 amount) external {
        DelegationPoolLib.deposit(pool, account, amount);
    }

    function depositWithHistoricalData(address account, uint256 amount, uint256 epochId) external {
        DelegationPoolLib.deposit(pool, account, amount, epochId);
    }

    function withdraw(address account, uint256 amount) external {
        DelegationPoolLib.withdraw(pool, account, amount);
    }

    function withdrawWithHistoricalData(address account, uint256 amount, uint256 epochId) external {
        DelegationPoolLib.withdraw(pool, account, amount, epochId);
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

    function virtualSupplyGetter() external view returns (uint256) {
        return pool.virtualSupply;
    }

    function magnifiedRewardPerShareGetter() external view returns (uint256) {
        return pool.magnifiedRewardPerShare;
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

    function getDelegatorHistoryParams(
        address account,
        uint256 index
    ) external view returns (uint256 balance, int256 correction, uint256 epochNum) {
        DelegationPoolDelegatorParams memory params = pool.delegatorsParamsHistory[account][index];
        return (params.balance, params.correction, params.epochNum);
    }
}
