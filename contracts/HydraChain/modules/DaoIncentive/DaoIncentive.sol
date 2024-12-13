// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {System} from "../../../common/System/System.sol";
import {RewardWalletConnector} from "../../../RewardWallet/RewardWalletConnector.sol";
import {HydraStakingConnector} from "../../../HydraStaking/HydraStakingConnector.sol";
import {IDaoIncentive} from "./IDaoIncentive.sol";

abstract contract DaoIncentive is IDaoIncentive, System, Initializable, RewardWalletConnector, HydraStakingConnector {
    /// @notice last rewards distribution timestamp
    uint256 public lastDistribution;
    uint256 public vaultDistribution;
    address public daoIncentiveVaultContract;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __DaoIncentive_init(
        address rewardWalletAddr,
        address hydraStakingAddr,
        address daoIncentiveVaultAddr
    ) internal onlyInitializing {
        __RewardWalletConnector_init(rewardWalletAddr);
        __HydraStakingConnector_init(hydraStakingAddr);
        __DaoIncentive_init_unchained(daoIncentiveVaultAddr);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __DaoIncentive_init_unchained(address daoIncentiveVaultAddr) internal {
        daoIncentiveVaultContract = daoIncentiveVaultAddr;
        lastDistribution = block.timestamp;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDaoIncentive
     */
    function distributeDAOIncentive() external onlySystemCall {
        uint256 reward = (
            ((hydraStakingContract.totalBalance() * 200 * (block.timestamp - lastDistribution)) / (10000 * 365 days))
        );
        lastDistribution = block.timestamp;
        vaultDistribution += reward;

        emit VaultFundsDistributed(reward);
    }

    /**
     * @inheritdoc IDaoIncentive
     */
    function claimVaultFunds() external {
        uint256 incentive = vaultDistribution;
        if (incentive == 0) {
            revert NoVaultFundsToClaim();
        }

        vaultDistribution = 0;
        rewardWalletContract.distributeReward(daoIncentiveVaultContract, incentive);

        emit VaultFunded(incentive);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
