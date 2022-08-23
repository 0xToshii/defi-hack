import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
const BN = BigNumber;
let precision = BN.from(10).pow(18);
let denom = BN.from(10).pow(11);

let accounts: Signer[];
let attacker: Signer;
let other1: Signer;
let other2: Signer;

let shitToken: Contract;
let weth: Contract;
let p2pSwapper: Contract;


before(async () => {
  accounts = await ethers.getSigners();
  [attacker, other1, other2] = accounts;

  const wethFactory = await ethers.getContractFactory('P2P_WETH')
  weth = await wethFactory.connect(other2).deploy()

  const shitTokenFactory = await ethers.getContractFactory('Token')
  shitToken = await shitTokenFactory.connect(other2).deploy('SHIT',await other2.getAddress(),precision.mul(100_000))

  // initiating P2PSwapper and submitting a trade from WETH -> SHIT
  const p2pSwapperFactory = await ethers.getContractFactory('P2PSwapper')
  p2pSwapper = await p2pSwapperFactory.connect(other2).deploy(weth.address)

  await weth.connect(other2).deposit({value:precision.mul(1)})
  await weth.connect(other2).approve(p2pSwapper.address,ethers.constants.MaxUint256)

  await p2pSwapper.connect(other2).createDeal(weth.address,precision.mul(1).div(denom),shitToken.address,precision.mul(1).div(denom),{value:2_000_000}) // submitting 1-1 trade between WETH and SHIT, numbers selected for easy math
});

it("solves the challenge", async function () {

});

after(async () => {
  expect(await weth.balanceOf(p2pSwapper.address)).to.be.equal(0)
});
