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
    /// @notice last rewards distribution timestamp
    uint256 public lastDistribution;
    uint256 public vaultDistribution;
    address public daoIncentiveVaultAddr;

    // _______________ Initializer _______________

    // solhint-disable-next-line func-name-mixedcase
    function __DaoIncentive_init(
        address _aprCalculatorAddr,
        address _rewardWalletAddr,
        address _daoIncentiveVaultAddr
    ) internal onlyInitializing {
        __APRCalculatorConnector_init(_aprCalculatorAddr);
        __RewardWalletConnector_init(_rewardWalletAddr);
        __DaoIncentive_init_unchained(_daoIncentiveVaultAddr);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __DaoIncentive_init_unchained(address _daoIncentiveVaultAddr) internal {
        daoIncentiveVaultAddr = _daoIncentiveVaultAddr;
        lastDistribution = block.timestamp;
    }

    // _______________ External functions _______________

    /**
     * @inheritdoc IDaoIncentive
     */
    function distributeDAOIncentive() external onlySystemCall {
        uint256 reward = (((hydraStakingContract.totalBalance() * 200) / 10000) *
            (block.timestamp - lastDistribution)) / 365 days;
        lastDistribution = block.timestamp;
        vaultDistribution += reward;

        emit VaultFundsDistributed(reward);
    }

    /**
     * @inheritdoc IDaoIncentive
     */
    function claimVaultFunds() external {
        uint256 reward = vaultDistribution;
        if (reward == 0) {
            revert NoVaultFundsToClaim();
        }

        vaultDistribution = 0;
        rewardWalletContract.distributeReward(daoIncentiveVaultAddr, reward);

        emit VaultFunded(reward);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
