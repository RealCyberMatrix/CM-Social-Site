import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import { config } from "dotenv";
import "hardhat-gas-reporter";
import { task } from "hardhat/config";
import "solidity-coverage";

config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  // eslint-disable-next-line no-restricted-syntax
  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: "0.6.12",
  paths: {
    artifacts: "./src/artifacts",
    // sources: "./contracts/exchange"  //use it when you try to flatten a single file
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
  },
  networks: {
    hardhat: {
      chainId: 1337,
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    },
    mumbai: {
      chainId: 80001,
      url:
        process.env.MUMBAI_PROVIDER_URL || "https://speedy-nodes-nyc.moralis.io/036063875a28828fa0c00596/polygon/mumbai",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygonmainnet: {
      chainId: 137,
      url: process.env.POLYGONMAINNET_PROVIDER_URL || "https://speedy-nodes-nyc.moralis.io/abacd307ace675368f0ed34c/polygon/mumbai",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};