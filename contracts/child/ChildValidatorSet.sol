// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Arrays.sol";

interface IStateReceiver {
    function onStateReceive(uint256 id, bytes calldata data) external;
}

/**
    @title ChildValidatorSet
    @author Polygon Technology
    @notice Validator set genesis contract for Polygon PoS v3. This contract serves the purpose of storing stakes.
    @dev The contract is used to complete validator registration and store self-stake and delegated MATIC amounts.
 */
contract ChildValidatorSet is IStateReceiver {
    using Arrays for uint256[];
    struct Validator {
        uint256 id;
        address _address;
        uint256[4] blsKey;
        uint256 selfStake;
        uint256 stake; // self-stake + delegation, store delegation separately?
    }

    struct Epoch {
        uint256 id;
        uint256 startBlock;
        uint256 endBlock;
        uint256[] validatorSet;
        uint256[] producerSet;
    }

    bytes32 public constant NEW_VALIDATOR_SIG =
        0xbddc396dfed8423aa810557cfed0b5b9e7b7516dac77d0b0cdf3cfbca88518bc;
    uint256 public constant SPRINT = 64;
    uint256 public currentValidatorId;
    uint256 public currentEpochId;

    mapping(uint256 => Validator) public validators;
    mapping(address => uint256) public validatorIdByAddress;
    mapping(uint256 => Epoch) public epochs;

    uint256[] public epochEndBlocks;

    uint8 private initialized;

    event NewValidator(
        uint256 indexed id,
        address indexed validator,
        uint256[4] blsKey
    );

    event NewEpoch(
        uint256 indexed id,
        uint256 indexed startBlock,
        uint256 indexed endBlock
    );

    modifier initializer() {
        // OZ initializer is too bulky...
        require(initialized == 0, "ALREADY_INITIALIZED");
        _;
        initialized = 1;
    }

    modifier onlySystemCall() {
        require(
            msg.sender == 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE,
            "ONLY_SYSTEMCALL"
        );
        _;
    }

    /**
     * @notice Initializer function for genesis contract, called by v3 client at genesis to set up the initial set.
     * @param validatorAddresses Addresses of validators
     * @param validatorPubkeys BLS pubkeys of validators
     */
    function initialize(
        address[] calldata validatorAddresses,
        uint256[4][] calldata validatorPubkeys,
        uint256[] calldata validatorStakes,
        uint256[] calldata epochValidatorSet,
        uint256[] calldata epochProducerSet
    ) external initializer onlySystemCall {
        uint256 currentId = 0; // set counter to 0 assuming validatorId is currently at 0 which it should be...
        for (uint256 i = 0; i < validatorAddresses.length; i++) {
            Validator storage newValidator = validators[++currentId];
            newValidator.id = currentId;
            newValidator._address = validatorAddresses[i];
            newValidator.blsKey = validatorPubkeys[i];
            newValidator.selfStake = validatorStakes[i];
            newValidator.stake = validatorStakes[i];

            validatorIdByAddress[validatorAddresses[i]] = currentId;
        }
        currentValidatorId = currentId;

        Epoch storage nextEpoch = epochs[1];
        nextEpoch.validatorSet = epochValidatorSet;
        nextEpoch.producerSet = epochProducerSet;
    }

    /**
     * @notice Allows the v3 client to commit epochs to this contract.
     * @param id ID of epoch to be committed
     * @param startBlock First block in epoch
     * @param endBlock Last block in epoch
     * @param epochValidatorSet Update validator set for next epoch
     * @param epochProducerSet Update producer set for next epoch
     */
    function commitEpoch(
        uint256 id,
        uint256 startBlock,
        uint256 endBlock,
        uint256[] calldata epochValidatorSet,
        uint256[] calldata epochProducerSet
    ) external onlySystemCall {
        uint256 newEpochId = ++currentEpochId;
        require(id == newEpochId, "UNEXPECTED_EPOCH_ID");
        require(endBlock > startBlock, "NO_BLOCKS_COMMITTED");
        require((endBlock - startBlock + 1) % SPRINT == 0, "INCOMPLETE_SPRINT");
        require(
            epochs[currentEpochId].endBlock < startBlock,
            "BLOCK_IN_COMMITTED_EPOCH"
        );

        Epoch storage newEpoch = epochs[newEpochId];
        newEpoch.id = newEpochId;
        newEpoch.endBlock = endBlock;
        newEpoch.startBlock = startBlock;

        epochEndBlocks.push(endBlock);

        Epoch storage nextEpoch = epochs[newEpochId + 1];
        nextEpoch.validatorSet = epochValidatorSet;
        nextEpoch.producerSet = epochProducerSet;

        emit NewEpoch(id, startBlock, endBlock);
    }

    function onStateReceive(
        uint256, /* id */
        bytes calldata data
    ) external {
        require(
            msg.sender == 0x0000000000000000000000000000000000001001,
            "INVALID_SENDER"
        );
        (bytes32 signature, bytes memory decodedData) = abi.decode(
            data,
            (bytes32, bytes)
        );
        require(signature == NEW_VALIDATOR_SIG, "INVALID_SIGNATURE");
        (uint256 id, address _address, uint256[4] memory blsKey) = abi.decode(
            decodedData,
            (uint256, address, uint256[4])
        );

        Validator storage newValidator = validators[id];
        newValidator.id = id;
        newValidator._address = _address;
        newValidator.blsKey = blsKey;

        validatorIdByAddress[_address] = id;

        currentValidatorId = id; // we assume statesyncs are strictly ordered

        emit NewValidator(id, _address, blsKey);
    }

    /**
     * @notice Look up an epoch by block number. Searches in O(log n) time.
     * @param blockNumber ID of epoch to be committed
     * @return bool Returns true if the search was successful, else false
     * @return Epoch Returns epoch if found, or else, the last epoch
     */
    function getEpochByBlock(uint256 blockNumber)
        external
        view
        returns (bool, Epoch memory)
    {
        uint256 ret = epochEndBlocks.findUpperBound(blockNumber);
        if (ret == epochEndBlocks.length) {
            return (false, epochs[currentEpochId]);
        } else {
            return (true, epochs[ret]);
        }
    }

    function calculateValidatorPower(uint256 id)
        external
        view
        returns (uint256)
    {
        uint256 totalStake = calculateTotalStake();
        uint256 validatorStake = validators[id].stake;
        return (validatorStake * 100 * 1000000) / totalStake; // returns at 6 degrees of precision
    }

    function calculateTotalStake() public view returns (uint256 stake) {
        for (uint256 i = 1; i <= currentValidatorId; i++) {
            stake += validators[i].stake;
        }
    }
}