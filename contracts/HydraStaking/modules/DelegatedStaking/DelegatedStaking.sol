// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Unauthorized} from "../../../common/Errors.sol";
import {IHydraDelegation} from "../../../HydraDelegation/IHydraDelegation.sol";
import {Staking} from "../../Staking.sol";
import {IDelegatedStaking} from "./IDelegatedStaking.sol";

abstract contract DelegatedStaking is IDelegatedStaking, Staking {
    IHydraDelegation public delegationContract;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __DelegatedStaking_init(
        uint256 newMinStake,
        address governance,
        address aprCalculatorAddr,
        address hydraChainAddr,
        address hydraDelegationAddr,
        address rewardWalletAddr
    ) internal onlyInitializing {
        __Staking_init(newMinStake, aprCalculatorAddr, rewardWalletAddr, hydraChainAddr, governance);
        __DelegatedStaking_init_unchained(hydraDelegationAddr);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __DelegatedStaking_init_unchained(address _hydraDelegationAddr) internal onlyInitializing {
        delegationContract = IHydraDelegation(_hydraDelegationAddr);
    }

    // _______________ Modifiers _______________

    modifier onlyDelegationContract() {
        if (msg.sender != address(delegationContract)) {
            revert Unauthorized("ONLY_HYDRA_DELEGATION");
        }

        _;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDelegatedStaking
     */
    function onDelegate(address staker) external onlyDelegationContract onlyActiveStaker(staker) {
        _onDelegate(staker);
    }

    /**
     * @inheritdoc IDelegatedStaking
     */
    function onUndelegate(address staker) external onlyDelegationContract {
        _onUndelegate(staker);
    }

    // _______________ Internal functions _______________

    /**
     * @notice Called when a delegator delegates
     * @param staker The staker address
     */
    function _onDelegate(address staker) internal virtual;

    /**
     * @notice Called when a delegator undelegates
     * @param staker The staker address
     */
    function _onUndelegate(address staker) internal virtual;

    /**
     * @notice Distributes the delegation rewards
     * @param staker The staker address
     * @param reward The reward amount
     * @param epochId The epoch id
     */
    function _distributeDelegationRewards(address staker, uint256 reward, uint256 epochId) internal {
        delegationContract.distributeDelegationRewards(staker, reward, epochId);
    }

    /**
     * @notice Returns the total amount of delegation
     * @return The total amount of delegation
     */
    function _totalDelegation() internal view returns (uint256) {
        return delegationContract.totalDelegation();
    }

    /**
     * @notice Returns the total amount of delegation for a staker
     * @param staker The staker address
     * @return The total amount of delegation for the staker
     */
    function _getStakerDelegatedBalance(address staker) internal view returns (uint256) {
        return delegationContract.totalDelegationOf(staker);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
