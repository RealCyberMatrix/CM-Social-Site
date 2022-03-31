// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";

async function main() {
  // We get the contract to deploy
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());


  const marketContractFactory = await hre.ethers.getContractFactory("ERC1155MarketWithERC20AsPayment");
  const marketContract = await marketContractFactory.deploy();

  await marketContract.deployed();
  console.log("Market contract deployed to:", marketContract.address);
  console.log("owner", await marketContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });