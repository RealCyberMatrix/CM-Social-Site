## Deployment history on Polygon mumbai testnet

### Market contract supporting payment with ERC20

https://mumbai.polygonscan.com/address/0x95353AACE6c37882bb2DCAcb74FfE86AB4823fb6

### ERC1155 contract with signer signature validation

https://mumbai.polygonscan.com/address/0x6568061b0E59b3030E8F6dCc62307B675affccbC

### ERC20 coin LTC

https://mumbai.polygonscan.com/address/0x859c69876845060ac34e4f995f9d6955e02d809d

### ERC20 coin ZYC

https://mumbai.polygonscan.com/address/0xB612F27Daf240feF198ec48203c358346a344c03

### .env for contract address

- VITE_TOKEN_CONTRACT_ADDRESS=0x1Ca714E2B759f901872f3eC42bF93914A9C0038F

### generate a single file for deployment or security scan

```shell
yarn hardhat flatten > contracts/single_contract.sol
```

- source config in [hardhat.config.ts](../hardhat.config.ts)

```js
  paths: {
    artifacts: "./src/artifacts",
    // sources: "./contracts/exchange"  //use it when you try to flatten a single file
  },
```

- flatten only 1 file? make sure the sources directory only have the one you want
