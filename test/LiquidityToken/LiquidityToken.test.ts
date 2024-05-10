import { ethers } from "hardhat";
/* eslint-disable node/no-extraneous-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

describe("LiquidityToken", async function () {
  const tokenName = "Lydra";
  const tokenSymbol = "LDR";
  let accounts: SignerWithAddress[],
    governerRole: string,
    supplyControllerRole: string,
    governer: SignerWithAddress,
    supplyController: SignerWithAddress;

  this.beforeAll(async () => {
    accounts = await ethers.getSigners();
    governerRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
    supplyControllerRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SUPPLY_CONTROLLER_ROLE"));
    governer = accounts[1];
    supplyController = accounts[2];
  });

  async function deployFixture() {
    const TokenFactory = await ethers.getContractFactory("LiquidityToken");
    const token = await TokenFactory.deploy();
    await token.deployed();

    return { token };
  }

  async function initializeFixture() {
    const { token } = await loadFixture(deployFixture);
    await token.initialize(tokenName, tokenSymbol, governer.address, supplyController.address);

    return { token };
  }

  it("should have default admin role set", async () => {
    const { token } = await loadFixture(deployFixture);
    expect(await token.DEFAULT_ADMIN_ROLE()).equal(governerRole);
  });

  it("should have supply controller role set", async () => {
    const { token } = await loadFixture(deployFixture);
    expect(await token.SUPPLY_CONTROLLER_ROLE()).equal(supplyControllerRole);
  });

  describe("initialize()", async function () {
    it("should be properly initialized", async () => {
      const { token } = await loadFixture(initializeFixture);

      expect(await token.name()).to.be.equal(tokenName);
      expect(await token.symbol()).to.be.equal(tokenSymbol);
      expect(await token.hasRole(governerRole, governer.address)).to.be.equal(true);
      expect(await token.hasRole(supplyControllerRole, supplyController.address)).to.be.equal(true);
    });

    it("should not be able to initialize twice", async () => {
      const { token } = await loadFixture(initializeFixture);

      await expect(
        token.initialize(tokenName, tokenSymbol, governer.address, supplyController.address)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("mint()", async function () {
    it("Should revert if not executed by supply controller address", async () => {
      const { token } = await loadFixture(initializeFixture);

      await expect(token.mint(accounts[4].address, 100)).to.be.revertedWith(
        "AccessControl: account " + accounts[0].address.toLowerCase() + " is missing role " + supplyControllerRole
      );
    });
  });

  describe("burn()", async function () {
    it("Should revert if not executed by supply controller address", async () => {
      const { token } = await loadFixture(initializeFixture);

      await expect(token.burn(accounts[4].address, 100)).to.be.revertedWith(
        "AccessControl: account " + accounts[0].address.toLowerCase() + " is missing role " + supplyControllerRole
      );
    });
  });

  describe("Change supply controller", async function () {
    it("Should revert if non-admin is trying to change supply controller", async () => {
      const { token } = await loadFixture(initializeFixture);

      await expect(token.revokeRole(supplyControllerRole, supplyController.address)).to.be.revertedWith(
        "AccessControl: account " + accounts[0].address.toLowerCase() + " is missing role " + governerRole
      );

      await expect(token.grantRole(supplyControllerRole, accounts[5].address)).to.be.revertedWith(
        "AccessControl: account " + accounts[0].address.toLowerCase() + " is missing role " + governerRole
      );
    });

    it("Should properly update the role", async () => {
      const { token } = await loadFixture(initializeFixture);

      await token.connect(governer).revokeRole(supplyControllerRole, supplyController.address);
      await token.connect(governer).grantRole(supplyControllerRole, accounts[5].address);

      expect(await token.hasRole(supplyControllerRole, supplyController.address)).to.be.equal(false);
      expect(await token.hasRole(supplyControllerRole, accounts[5].address)).to.be.equal(true);
    });
  });
});
