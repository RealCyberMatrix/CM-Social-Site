// eslint-disable-next-line import/no-extraneous-dependencies
// import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";

async function main() {
  // We get the contract to deploy
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());


  const FollowingContract = await hre.ethers.getContractFactory("ERC1155Following");
  const deployedContract = await FollowingContract.deploy('CyberMatrixFollow', 'CMF', 'a fake prefix');

  await deployedContract.deployed();
  console.log("FollowingContract deployed to:", deployedContract.address);
  console.log("owner", await deployedContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });