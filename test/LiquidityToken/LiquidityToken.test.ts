import { ethers } from "hardhat";
/* eslint-disable node/no-extraneous-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getPermitSignature } from "../helper";
import { DEADLINE, ERRORS, SYSTEM } from "../constants";
import { expect } from "chai";

export function RunLiquidityTokenTests(): void {
  describe("", async function () {
    const tokenName = "Lydra";
    const tokenSymbol = "LDR";
    let accounts: SignerWithAddress[],
      governorRole: string,
      supplyControllerRole: string,
      governance: SignerWithAddress,
      supplyController: SignerWithAddress;

    this.beforeAll(async () => {
      accounts = await ethers.getSigners();
      governorRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
      supplyControllerRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SUPPLY_CONTROLLER_ROLE"));
      governance = accounts[1];
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
      const system = await ethers.getSigner(SYSTEM);
      await token
        .connect(system)
        .initialize(tokenName, tokenSymbol, governance.address, supplyController.address, supplyController.address);

      return { token };
    }

    it("should have default admin role set", async () => {
      const { token } = await loadFixture(deployFixture);
      expect(await token.DEFAULT_ADMIN_ROLE()).equal(governorRole);
    });

    it("should have supply controller role set", async () => {
      const { token } = await loadFixture(deployFixture);
      expect(await token.SUPPLY_CONTROLLER_ROLE()).equal(supplyControllerRole);
    });

    describe("initialize()", async function () {
      it("should revert initialize from non-system address", async () => {
        const { token } = await loadFixture(deployFixture);
        await expect(
          token
            .connect(governance)
            .initialize(tokenName, tokenSymbol, governance.address, supplyController.address, supplyController.address)
        ).to.be.revertedWithCustomError(token, ERRORS.unauthorized.name);
      });

      it("should be properly initialized", async () => {
        const { token } = await loadFixture(initializeFixture);

        expect(await token.name()).to.be.equal(tokenName);
        expect(await token.symbol()).to.be.equal(tokenSymbol);
        expect(await token.hasRole(governorRole, governance.address)).to.be.equal(true);
        expect(await token.hasRole(supplyControllerRole, supplyController.address)).to.be.equal(true);
      });

      it("should not be able to initialize twice", async () => {
        const { token } = await loadFixture(initializeFixture);

        await expect(
          token.initialize(
            tokenName,
            tokenSymbol,
            governance.address,
            supplyController.address,
            supplyController.address
          )
        ).to.be.revertedWith(ERRORS.initialized);
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

    describe("permit()", async function () {
      it("Should be able to transfer to the user with a permit", async () => {
        const amount = 1000;
        const { token } = await loadFixture(initializeFixture);
        const { v, r, s } = await getPermitSignature(supplyController, token, accounts[0].address, amount, DEADLINE);

        await token.connect(supplyController).mint(supplyController.address, 10000);
        await token.permit(supplyController.address, accounts[0].address, amount, DEADLINE, v, r, s);
        await token.connect(accounts[0]).transferFrom(supplyController.address, accounts[0].address, amount);

        expect(await token.balanceOf(accounts[0].address)).to.equal(ethers.BigNumber.from(amount));
        expect(await token.balanceOf(supplyController.address)).to.equal(ethers.BigNumber.from(10000).sub(amount));
      });
    });

    describe("Change supply controller", async function () {
      it("Should revert if non-admin is trying to change supply controller", async () => {
        const { token } = await loadFixture(initializeFixture);

        await expect(token.revokeRole(supplyControllerRole, supplyController.address)).to.be.revertedWith(
          "AccessControl: account " + accounts[0].address.toLowerCase() + " is missing role " + governorRole
        );

        await expect(token.grantRole(supplyControllerRole, accounts[5].address)).to.be.revertedWith(
          "AccessControl: account " + accounts[0].address.toLowerCase() + " is missing role " + governorRole
        );
      });

      it("Should properly update the role", async () => {
        const { token } = await loadFixture(initializeFixture);

        await token.connect(governance).revokeRole(supplyControllerRole, supplyController.address);
        await token.connect(governance).grantRole(supplyControllerRole, accounts[5].address);

        expect(await token.hasRole(supplyControllerRole, supplyController.address)).to.be.equal(false);
        expect(await token.hasRole(supplyControllerRole, accounts[5].address)).to.be.equal(true);
      });
    });
  });
}
