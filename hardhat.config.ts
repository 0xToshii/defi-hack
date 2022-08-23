import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: "0.6.6" },
      { version: "0.6.12" },
      { version: "0.7.3" },
      { version: "0.8.0" }
    ],
  },
  mocha: {
    timeout: 300 * 1e3,
  }
};

export default config;