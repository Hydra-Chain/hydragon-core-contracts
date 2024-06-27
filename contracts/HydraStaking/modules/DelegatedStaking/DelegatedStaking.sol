// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Staking} from "./../../Staking.sol";
import {IHydraDelegation} from "./../../../HydraDelegation/IHydraDelegation.sol";
import {Unauthorized} from "./../../../common/Errors.sol";

abstract contract DelegatedStaking is Staking {
    IHydraDelegation public delegationContract;

    function __DelegatedStaking_init(address delegationContractAddr) internal onlyInitializing {
        __DelegatedStaking_init_unchained(delegationContractAddr);
    }

    function __DelegatedStaking_init_unchained(address delegationContractAddr) internal onlyInitializing {
        delegationContract = IHydraDelegation(delegationContractAddr);
    }

    modifier onlyDelegationContract() {
        if (msg.sender != address(aprCalculatorContract)) {
            revert Unauthorized("ONLY_APR_CALCULATOR");
        }

        _;
    }

    function onDelegate(address staker) external onlyDelegationContract onlyActiveStaker(staker) {
        _onDelegate(staker);
    }

    function onUndelegate(address staker) external onlyDelegationContract {
        _onUndelegate(staker);
    }

    function _onDelegate(address staker) internal virtual;

    function _onUndelegate(address staker) internal virtual;

    function _totalDelegation() internal view returns (uint256) {
        return delegationContract.totalDelegation();
    }

    function _getStakerDelegatedBalance(address staker) internal view returns (uint256) {
        return delegationContract.totalDelegationOf(staker);
    }

    function _getstakerDelegationCommission(address staker) internal view returns (uint256) {
        return delegationContract.stakerDelegationCommission(staker);
    }

    function distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) internal {
        delegationContract.distributeDelegationRewards(staker, reward, epochId);
    }
}
