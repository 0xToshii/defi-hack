import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
const BN = BigNumber;
let precision = BN.from(10).pow(18);

let accounts: Signer[];
let attacker: Signer;
let other1: Signer;
let other2: Signer;
let miniMeToken: Contract;
let mayTheForce: Contract;

before(async () => {
  accounts = await ethers.getSigners();
  [attacker, other1, other2] = accounts;

  const miniMeTokenFactory = await ethers.getContractFactory('MiniMeToken')
  miniMeToken = await miniMeTokenFactory.connect(other2).deploy('Yoda token', 18, 'YODA')

  const mayTheForceFactory = await ethers.getContractFactory('MayTheForceBeWithYou')
  mayTheForce = await mayTheForceFactory.connect(other2).deploy(miniMeToken.address)

  // although in this case there are no other stakers, this does not change the exploit
  await miniMeToken.connect(other2).mint(mayTheForce.address,precision.mul(1))
});

it("solves the challenge", async function () {

});

after(async () => {
  expect(await miniMeToken.balanceOf(mayTheForce.address)).to.be.equal(0)
  expect(await miniMeToken.balanceOf(await attacker.getAddress())).to.be.equal(precision.mul(1))
});
