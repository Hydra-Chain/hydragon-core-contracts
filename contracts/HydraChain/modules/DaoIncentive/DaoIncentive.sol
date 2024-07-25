// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {APRCalculatorConnector} from "../../../APRCalculator/APRCalculatorConnector.sol";
import {RewardWalletConnector} from "../../../RewardWallet/RewardWalletConnector.sol";
import {HydraStakingConnector} from "../../../HydraStaking/HydraStakingConnector.sol";
import {IDaoIncentive} from "./IDaoIncentive.sol";

abstract contract DaoInsentive is
    IDaoIncentive,
    System,
    Initializable,
    APRCalculatorConnector,
    RewardWalletConnector,
    HydraStakingConnector
{
    address public hydraVault;
    uint256 public vaultDistribution;
    mapping(uint256 => uint256) public vaultDistributionPerEpoch;

    // _______________ Initializer _______________

    /**
     * @notice Initializer function for genesis contract, called by the Hydra client at genesis to set up the initial state.
     * @dev only callable by client, can only be called once
     */
    function __DaoInsentive_init(
        address aprCalculatorAddr,
        address rewardWalletAddr,
        address hydraVaultAddr
    ) internal onlyInitializing onlySystemCall {
        __APRCalculatorConnector_init(aprCalculatorAddr);
        __RewardWalletConnector_init(rewardWalletAddr);
        __DaoInsentive_init_unchained(hydraVaultAddr);
    }

    function __DaoInsentive_init_unchained(address hydraVaultAddr) private {
        hydraVault = hydraVaultAddr;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDaoIncentive
     */
    function distributeVaultFunds() external onlySystemCall {
        uint256 currentEpochId = getCurrentEpochId();
        require(vaultDistributionPerEpoch[currentEpochId] == 0, "VAULT_FUNDS_ALREADY_DISTRIBUTED");

        uint256 reward = ((hydraStakingContract.totalBalance() * 200) / 10000) /
            aprCalculatorContract.getEpochsPerYear();
        vaultDistributionPerEpoch[currentEpochId] = reward;
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

        emit VaultFunded(getCurrentEpochId(), reward);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc IDaoIncentive
     */
    function getCurrentEpochId() public view virtual override returns (uint256) {}

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
