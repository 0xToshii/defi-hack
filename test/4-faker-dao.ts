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

let yinToken: Contract;
let yangToken: Contract;
let fakerDAO: Contract;

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
  yinToken = await (await ethers.getContractFactory('Token')).connect(other2).deploy('YIN',other2Address,precision.mul(1_005_000))
  yangToken = await (await ethers.getContractFactory('Token')).connect(other2).deploy('YANG',other2Address,precision.mul(1_005_000))

  // sending attacker tokens
  await yinToken.connect(other2).transfer(attAddress,precision.mul(5_000))
  await yangToken.connect(other2).transfer(attAddress,precision.mul(5_000))

  // creating LP for YIN/YANG
  let tx = await uniswapFactory.connect(other2).createPair(yinToken.address,yangToken.address)
  let receipt = await tx.wait()
  let pairAddress = receipt.events[0]['args']['pair'] // address of LP
  // console.log(receipt.events[0]['args']) // YANG is token0, YIN is token1

  // creating FakerDAO
  const fakerDAOFactory = await ethers.getContractFactory('FakerDAO')
  fakerDAO = await fakerDAOFactory.connect(other2).deploy(pairAddress)

  // creating LP for YIN/YANG and sending to fakerDAO
  await yinToken.connect(other2).approve(uniswapRouter.address,ethers.constants.MaxUint256)
  await yangToken.connect(other2).approve(uniswapRouter.address,ethers.constants.MaxUint256)

  await uniswapRouter.connect(other2).addLiquidity(yinToken.address,yangToken.address,precision.mul(1_000_000),precision.mul(1_000_000),1,1,fakerDAO.address,ethers.constants.MaxUint256)
});

it("solves the challenge", async function () {

});

after(async () => {
  expect(await fakerDAO.balanceOf(await attacker.getAddress())).to.be.above(0)
});
