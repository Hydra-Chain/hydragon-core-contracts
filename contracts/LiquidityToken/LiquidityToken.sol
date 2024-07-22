// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "../common/System/System.sol";
import "../common/Governed/Governed.sol";
import "./ILiquidityToken.sol";

/**
 * @title LiquidityToken
 * @dev This contract represents the liquid token for the Hydra staking mechanism.
 */
contract LiquidityToken is ILiquidityToken, System, ERC20Upgradeable, ERC20PermitUpgradeable, Governed {
    /// @notice The role identifier for address(es) that have permission to mint and burn the token.
    bytes32 public constant SUPPLY_CONTROLLER_ROLE = keccak256("SUPPLY_CONTROLLER_ROLE");

    // _______________ Initializer _______________

    /**
     * @dev Initializes the token contract with the provided name, symbol, governed role, and supply controller.
     * @param name_ The name of the token.
     * @param symbol_ The symbol of the token.
     * @param governer The address that has rights to change the SUPPLY_CONTROLLERs.
     * @param hydraStakingAddr The address assigned for controlling the supply (mint/burn) of the token. (HydraStaking.sol)
     * @param hydraDelegationAddr The address assigned for controlling the supply (mint/burn) of the token. (HydraDelegation.sol)
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        address governer,
        address hydraStakingAddr,
        address hydraDelegationAddr
    ) external initializer onlySystemCall {
        __ERC20_init(name_, symbol_);
        __ERC20Permit_init(name_);
        __Governed_init(governer);

        _grantRole(SUPPLY_CONTROLLER_ROLE, hydraStakingAddr);
        _grantRole(SUPPLY_CONTROLLER_ROLE, hydraDelegationAddr);
    }

    // _______________ Public functions _______________

    /**
     * @inheritdoc ILiquidityToken
     */
    function mint(address to, uint256 amount) public onlyRole(SUPPLY_CONTROLLER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @inheritdoc ILiquidityToken
     */
    function burn(address account, uint256 amount) public onlyRole(SUPPLY_CONTROLLER_ROLE) {
        _burn(account, amount);
    }

    // slither-disable-next-line unused-state,naming-convention
    uint256[50] private __gap;
}
