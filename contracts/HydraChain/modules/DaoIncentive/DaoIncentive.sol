// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {APRCalculatorConnector} from "../../../APRCalculator/APRCalculatorConnector.sol";
import {RewardWalletConnector} from "../../../RewardWallet/RewardWalletConnector.sol";
import {HydraStakingConnector} from "../../../HydraStaking/HydraStakingConnector.sol";
import {IDaoIncentive} from "./IDaoIncentive.sol";

abstract contract DaoIncentive is
    IDaoIncentive,
    System,
    Initializable,
    APRCalculatorConnector,
    RewardWalletConnector,
    HydraStakingConnector
{
    address public hydraVault;
    uint256 public vaultDistribution;

    mapping(uint256 => bool) internal _isDistributionAvailable;

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by the Hydra client at genesis to set up the initial state.
     * @dev only callable by client, can only be called once
     */
    function __DaoIncentive_init(
        address aprCalculatorAddr,
        address rewardWalletAddr,
        address hydraVaultAddr
    ) internal onlyInitializing {
        __APRCalculatorConnector_init(aprCalculatorAddr);
        __RewardWalletConnector_init(rewardWalletAddr);
        __DaoIncentive_init_unchained(hydraVaultAddr);
    }

    function __DaoIncentive_init_unchained(address hydraVaultAddr) internal {
        hydraVault = hydraVaultAddr;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDaoIncentive
     */
    function distributeVaultFunds() external onlySystemCall {
        uint256 currentEpochId = _checkDistributionAvailability();
        uint256 reward = ((hydraStakingContract.totalBalance() * 200) / 10000) /
            aprCalculatorContract.getEpochsPerYear();
        vaultDistribution += reward;

        emit VaultFundsDistributed(currentEpochId, reward);
    }

    /**
     * @inheritdoc IDaoIncentive
     */
    function claimVaultFunds() external {
        uint256 reward = vaultDistribution;
        require(reward != 0, "NO_VAULT_FUNDS_TO_CLAIM");

        vaultDistribution = 0;
        rewardWalletContract.distributeReward(hydraVault, reward);

        emit VaultFunded(reward);
    }

    // _______________ Internal functions _______________

    /**
     * @notice Check if in the current epoch the distribution is available
     * @return The current epoch id
     */
    function _checkDistributionAvailability() internal virtual returns (uint256) {}

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
