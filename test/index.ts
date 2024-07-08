import * as mcl from "../ts/mcl";

import { generateFixtures } from "./fixtures";
import { generateValidatorBls, initializeContext } from "./helper";
import { RunSystemTests } from "./common/System.test";
import { RunAPRCalculatorTests } from "./APRCalculator/APRCalculator.test";
// import { RunStakingTests } from "./Staking.test";
// import { RunDelegationTests } from "./Delegation.test";
// import { RunAPRTests } from "../RewardPool/APR.test";
import { RunLiquidityTokenTests } from "./LiquidityToken/LiquidityToken.test";
import { RunHydraChainTests } from "./HydraChain/HydraChain.test";
import { RunBLSTests } from "./common/BLS.test";

describe("Hydra Contracts", function () {
  before(async function () {
    // * Initialize the this context of mocha
    await initializeContext(this);

    /** Generate and initialize the context fixtures */
    await generateFixtures(this);

    await mcl.init();
    const validatorBls = generateValidatorBls(this.signers.admin);
    this.validatorInit = {
      addr: this.signers.admin.address,
      pubkey: validatorBls.pubkey,
      signature: validatorBls.signature,
      stake: this.minStake.mul(2),
    };
  });

  describe("Common modules", function () {
    describe("System", function () {
      RunSystemTests();
    });
    describe("BLS", function () {
      RunBLSTests();
    });
  });

  describe("APRCalculator", function () {
    RunAPRCalculatorTests();
  });

  describe("LiquidityToken", function () {
    RunLiquidityTokenTests();
  });

  describe("HydraChain", function () {
    RunHydraChainTests();
  });
});
