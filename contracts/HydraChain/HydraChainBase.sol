// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IHydraChain.sol";
import "./../common/Errors.sol";
import "../BLS/IBLS.sol";
import "../RewardPool/IRewardPool.sol";

abstract contract HydraChainBase is IHydraChain, Initializable {
    bytes32 public constant DOMAIN = keccak256("DOMAIN_HYDRA_CHAIN");

    IBLS public bls;

    IRewardPool public rewardPool;

    uint256 public currentEpochId;

    /// @notice Epoch data linked with the epoch id
    mapping(uint256 => Epoch) public epochs;

    /// @notice Array with epoch ending blocks
    uint256[] public epochEndBlocks;

    mapping(uint256 => uint256) internal _commitBlockNumbers;


    // _______________ Modifiers _______________

    modifier onlyRewardPool() {
        if (msg.sender != address(rewardPool)) revert Unauthorized("REWARD_POOL");
        _;
    }

    // _______________ Initializer _______________

    function __HydraChainBase_init(IBLS newBls, IRewardPool newRewardPool) internal onlyInitializing {
        __HydraChainBase_init_unchained(newBls, newRewardPool);
    }

    function __HydraChainBase_init_unchained(IBLS newBls, IRewardPool newRewardPool) internal onlyInitializing {
        bls = newBls;
        rewardPool = newRewardPool;
        currentEpochId = 1;
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
