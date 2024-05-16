// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IValidatorSet.sol";
import "./../common/Errors.sol";
import "./../BLS/IBLS.sol";
import "./../RewardPool/IRewardPool.sol";

abstract contract ValidatorSetBase is IValidatorSet, Initializable {
    bytes32 public constant DOMAIN = keccak256("DOMAIN_VALIDATOR_SET");

    IBLS public bls;

    IRewardPool public rewardPool;

    uint256 public currentEpochId;

    // slither-disable-next-line naming-convention
    mapping(address => Validator) public validators;

    address[] public validatorsAddresses;

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

    modifier onlyActiveValidator(address validator) {
        if (validators[validator].status != ValidatorStatus.Active) revert Unauthorized("INACTIVE_VALIDATOR");
        _;
    }

    /// @notice Modifier to check if the validator is registered or active
    modifier onlyValidator() {
        if (
            validators[msg.sender].status != ValidatorStatus.Registered &&
            validators[msg.sender].status != ValidatorStatus.Active
        ) revert Unauthorized("INVALID_VALIDATOR");
        _;
    }

    // _______________ Initializer _______________

    function __ValidatorSetBase_init(IBLS newBls, IRewardPool newRewardPool) internal onlyInitializing {
        __ValidatorSetBase_init_unchained(newBls, newRewardPool);
    }

    function __ValidatorSetBase_init_unchained(IBLS newBls, IRewardPool newRewardPool) internal onlyInitializing {
        bls = newBls;
        rewardPool = newRewardPool;
        currentEpochId = 1;
    }

    // _______________ Internal functions _______________

    function _verifyValidatorRegistration(
        address signer,
        uint256[2] calldata signature,
        uint256[4] calldata pubkey
    ) internal view {
        // slither-disable-next-line calls-loop
        (bool result, bool callSuccess) = bls.verifySingle(signature, pubkey, _message(signer));
        if (!callSuccess || !result) revert InvalidSignature(signer);
    }

    /// @notice Message to sign for registration
    function _message(address signer) internal view returns (uint256[2] memory) {
        // slither-disable-next-line calls-loop
        return bls.hashToPoint(DOMAIN, abi.encodePacked(signer, block.chainid));
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
