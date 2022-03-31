// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";

async function main() {
  // We get the contract to deploy
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());


  const zycTokenFactory = await hre.ethers.getContractFactory("TeamToken");
  const zycToken = await zycTokenFactory.deploy('ZIYOU Coin', 'ZYC', 18, hre.ethers.utils.parseUnits('1000000', 'ether'), deployer.address, deployer.address);

  await zycToken.deployed();
  console.log("ZYC Token deployed to:", zycToken.address);
  console.log("owner", await zycToken);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });