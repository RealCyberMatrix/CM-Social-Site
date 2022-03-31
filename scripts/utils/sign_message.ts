// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";

async function main() {
  // We get the contract to deploy
  const accounts = await hre.ethers.getSigners()
  const rst = accounts.filter(account => account.address === "0x3fcbAf4822e7c7364E43aEc8253dfc888b9235bB")
  console.log(accounts.length)
  console.log(rst)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
