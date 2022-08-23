import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
const BN = BigNumber;
let precision = BN.from(10).pow(18);

const factoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const weth = require("@uniswap/v2-periphery/build/WETH9.json");

let accounts: Signer[];
let attacker: Signer;
let other1: Signer;
let other2: Signer;

let uniswapFactory: Contract;
let uniswapRouter: Contract;
let weth9: Contract;

let jimboToken: Contract;
let jamboToken: Contract;
let discoLP: Contract;

before(async () => {
  accounts = await ethers.getSigners();
  [attacker, other1, other2] = accounts;

  let other2Address = await other2.getAddress()
  let attAddress = await attacker.getAddress()

  // setting up uniswapV2
  const uniswapFactoryFactory = new ethers.ContractFactory(factoryJson.abi,factoryJson.bytecode)
  const uniswapRouterFactory = new ethers.ContractFactory(routerJson.abi,routerJson.bytecode)
  const weth9Factory = new ethers.ContractFactory(weth.abi,weth.bytecode)

  uniswapFactory = await uniswapFactoryFactory.connect(other2).deploy(other2Address)
  weth9 = await weth9Factory.connect(other2).deploy()
  uniswapRouter = await uniswapRouterFactory.connect(other2).deploy(uniswapFactory.address,weth9.address)

  // setting up ERC20 tokens
  jimboToken = await (await ethers.getContractFactory('Token')).connect(other2).deploy('JIMBO',other2Address,precision.mul(100_001))
  jamboToken = await (await ethers.getContractFactory('Token')).connect(other2).deploy('JAMBO',other2Address,precision.mul(100_001))

  // sending attacker 1 of each token
  await jimboToken.connect(other2).transfer(attAddress,precision.mul(1))
  await jamboToken.connect(other2).transfer(attAddress,precision.mul(1))

  // creating LP for JIMBO/JAMBO
  let tx = await uniswapFactory.connect(other2).createPair(jimboToken.address,jamboToken.address)
  let receipt = await tx.wait()
  let pairAddress = receipt.events[0]['args']['pair'] // address of LP
  // console.log(receipt.events[0]['args']) // JAMBO is token0, JIMBO is token1

  // creating DiscoLP
  const discoLPFactory = await ethers.getContractFactory('DiscoLP')
  discoLP = await discoLPFactory.connect(other2).deploy('DISCO','DISCO',18,pairAddress)
  
  // creating LP for JIMBO/JAMBO and sending to discoLP
  await jimboToken.connect(other2).approve(uniswapRouter.address,ethers.constants.MaxUint256)
  await jamboToken.connect(other2).approve(uniswapRouter.address,ethers.constants.MaxUint256)

  await uniswapRouter.connect(other2).addLiquidity(jimboToken.address,jamboToken.address,precision.mul(100_000),precision.mul(100_000),1,1,discoLP.address,ethers.constants.MaxUint256)
});

it("solves the challenge", async function () {

});

after(async () => {
  expect(await discoLP.balanceOf(await attacker.getAddress())).to.be.above(precision.mul(100))
});
