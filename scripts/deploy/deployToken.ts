// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";

async function main() {
  // We get the contract to deploy
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());


  const realCyberMatrixERC1155TokenFactory = await hre.ethers.getContractFactory("RealCyberMatrixERC1155Token");
  const realContract = await realCyberMatrixERC1155TokenFactory.deploy('RealCyberMatrix', 'RCM', '0xDAAAD51a108F0cd3A3D56405e288885cD6586AbB', 'https://terry0.s3.us-west-1.amazonaws.com/test/', '');

  await realContract.deployed();
  console.log("RealCyberMatrixERC1155Token deployed to:", realContract.address);
  console.log("owner", await realContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });