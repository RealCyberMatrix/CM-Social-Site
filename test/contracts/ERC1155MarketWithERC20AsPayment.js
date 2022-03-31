/* eslint-disable */
const { expect } = require("chai");
const exp = require("constants");
const { ethers } = require("hardhat");

// token: ERC1155 token
// coin: ERC20 coin
// market: exchange contract
describe("Market", function () {
  it("Should be able to list, unlist, buy ERC1155 tokens by ERC20 token as payment", async function () {
    const [marketDeployer, tokenDeployer, coinDeployer, signer, bob, charlie, john] = await ethers.getSigners();
    const seller = [bob];
    const buyer = [john, charlie];

    console.log("market contract deployer: ", marketDeployer.address);
    console.log("ERC1155 token contract deployer: ", tokenDeployer.address);
    console.log("ERC20 token contract deployer: ", coinDeployer.address);

    // 1. deploy ERC1155 market contract
    const market = await ethers.getContractFactory("ERC1155MarketWithERC20AsPayment", marketDeployer);
    const marketContract = await market.deploy();
    await marketContract.deployed();
    let serviceCharge = ethers.utils.parseUnits("1", "finney"); // 0.001 ether native coin
    expect(await marketContract.getServiceCharge()).equals(serviceCharge);
    serviceCharge = ethers.utils.parseUnits("2", "finney"); // 0.001 ether
    try {
      await marketContract.connect(bob).setServiceCharge(serviceCharge);
      // should fail, bob is not market contract owner
    } catch (error) {
      expect(error).not.null;
    }
    await marketContract.connect(marketDeployer).setServiceCharge(serviceCharge);
    expect(await marketContract.getServiceCharge()).equals(serviceCharge);
    console.log("marketContract address", marketContract.address);
    console.log("service charge", serviceCharge);

    // 2. deploy ERC1155 token contract
    const realCyberMatrixERC1155TokenFactory = await ethers.getContractFactory(
      "RealCyberMatrixERC1155Token",
      tokenDeployer
    );
    const tokenContract = await realCyberMatrixERC1155TokenFactory.deploy(
      "RealCyberMatrix",
      "RCM",
      signer.address,
      "https://terry0.s3.us-west-1.amazonaws.com/test/",
      ""
    );
    await tokenContract.deployed();
    console.log("tokenContract address", tokenContract.address);

    // 3. deploy ERC20 token contract ZYC (Ziyou Coin), this is payment coin
    const zycContractFactory = await ethers.getContractFactory("TeamToken", coinDeployer);
    const zycSymbol = "ZYC";
    const zycName = "Ziyou Coin";
    const zycContract = await zycContractFactory.deploy(
      zycName,
      zycSymbol,
      18,
      ethers.utils.parseUnits("1000", "ether"),
      coinDeployer.address,
      coinDeployer.address
    );
    await zycContract.deployed();
    console.log("zycContract address", zycContract.address);
    expect(await zycContract.symbol()).equals(zycSymbol);
    // drop ZYC coins to buyers john, charlie 100 ZYC each
    await zycContract.connect(coinDeployer).transfer(john.address, ethers.utils.parseUnits("100", "ether"));
    await zycContract.connect(coinDeployer).transfer(charlie.address, ethers.utils.parseUnits("100", "ether"));
    expect(await zycContract.balanceOf(coinDeployer.address)).equals(ethers.utils.parseUnits("800", "ether"));
    expect(await zycContract.balanceOf(john.address)).equals(ethers.utils.parseUnits("100", "ether"));
    expect(await zycContract.balanceOf(charlie.address)).equals(ethers.utils.parseUnits("100", "ether"));

    // 4. bob, the seller, mints token No.0 and allow market contract to transfer his token
    let hashData = ethers.utils.solidityKeccak256(["address", "address"], [tokenContract.address, bob.address]);
    let signature = await signer.signMessage(ethers.utils.arrayify(hashData));
    const amountToMint = 10;
    let mintTx = await tokenContract.connect(bob).mint(signature, amountToMint, "rainbow.json");
    const { events } = await mintTx.wait();
    const tokenId = events[0].args.id;
    expect(tokenId).to.equal(0); // token Id 0 minted
    await tokenContract.connect(bob).setApprovalForAll(marketContract.address, true);
    expect(await tokenContract.connect(bob).isApprovedForAll(bob.address, marketContract.address)).to.be.true;
    expect(await tokenContract.connect(bob).balanceOf(bob.address, tokenId)).equals(amountToMint);

    // 5. bob, the seller, try to list 4 of token No.0 --> withdraw all --> list 4 of token No.0 again
    let amountToList = 4;
    let price = ethers.utils.parseUnits("1", "ether");
    try {
      await marketContract
        .connect(bob)
        .createMarketItem(tokenContract.address, tokenId, amountToList, price, "ZY", zycContract.address, "0x");
    } catch (error) {
      expect(error).not.null; // coin symbol input is wrong
    }
    await marketContract
      .connect(bob)
      .createMarketItem(tokenContract.address, tokenId, amountToList, price, zycSymbol, zycContract.address, "0x");
    marketItems = await marketContract.connect(bob).fetchMarketItems();
    expect(marketItems.length).equals(1);
    expect(marketItems[0].nftContract).equals(tokenContract.address);
    expect(marketItems[0].tokenId).equals(tokenId);
    expect(marketItems[0].seller).equals(bob.address);
    expect(marketItems[0].amount).equals(4);
    expect(marketItems[0].price).equals(price);
    expect(marketItems[0].coinSymbol).equals(zycSymbol);
    expect(marketItems[0].coinContract).equals(zycContract.address);
    expect(marketItems[0].sold).equals(false);
    expect(marketItems[0].itemId).equals(0);
    itemId = marketItems[0].itemId; // market item Id 0
    expect(await tokenContract.connect(bob).balanceOf(bob.address, tokenId)).equals(amountToMint - amountToList);
    // test withdraw
    await marketContract.connect(bob).withdrawMarketItem(itemId, 4, "0x");
    expect(await tokenContract.connect(bob).balanceOf(bob.address, tokenId)).equals(amountToMint);
    marketItems = await marketContract.connect(bob).fetchMarketItems();
    expect(marketItems.length).equals(0);
    let marketItemsCreatedByBob = await marketContract.connect(bob).fetchItemsCreated(bob.address);
    expect(marketItemsCreatedByBob[0].sold).to.be.true;
    // list again
    await marketContract
      .connect(bob)
      .createMarketItem(tokenContract.address, tokenId, amountToList, price, zycSymbol, zycContract.address, "0x");
    marketItems = await marketContract.connect(bob).fetchMarketItems();
    expect(marketItems.length).equals(1);
    expect(marketItems[0].itemId).equals(1);
    itemId = marketItems[0].itemId; // market item Id 1

    // 6. john , the buyer, trys to buy 3 of bob's listing
    let initBalanceOfbob = await bob.getBalance(); // seller's initial balance
    let initBalanceOfmarketDeployer = await marketDeployer.getBalance(); // market contract deployer's initial balance
    console.log("market owner balance: ", initBalanceOfmarketDeployer);
    let amountToBuy = 3; // price = 1 ether
    const allowance = ethers.utils.parseUnits("3", "ether");
    console.log("allowance of john: ", allowance);
    await zycContract.connect(john).approve(marketContract.address, ethers.utils.parseUnits("3", "ether")); // approve allowance
    expect(await zycContract.allowance(john.address, marketContract.address)).equals(allowance);
    const buyTx = await marketContract
      .connect(john)
      .createMarketSale(itemId, amountToBuy, "0x", { value: serviceCharge });
    const EventResBuyTx = await buyTx.wait();
    EventResBuyTx.events.forEach((event) => {
      if (event.event == "MarketItemSold") {
        expect(event.args.seller).equals(bob.address);
        expect(event.args.buyer).equals(john.address);
        expect(event.args.amount).equals(3);
      }
    });
    expect(await tokenContract.connect(john).balanceOf(john.address, tokenId)).equals(amountToBuy);
    // verify the token transaction
    marketItems = await marketContract.connect(john).fetchMarketItems();
    expect(marketItems[0].seller).equals(bob.address);
    expect(marketItems[0].amount).equals(1);
    expect(marketItems[0].sold).equals(false); // 1 left
    expect(await tokenContract.connect(john).balanceOf(john.address, tokenId)).equals(amountToBuy); // john owns 3 of token No.0
    // seller should receive all ZYC coins paid by buyer
    expect(await zycContract.balanceOf(bob.address)).equals(ethers.utils.parseUnits("3", "ether"));
    expect(await zycContract.balanceOf(john.address)).equals(ethers.utils.parseUnits("97", "ether")); // 97 ZYC coin left of john's balance
    // market owner should receive service charge
    expect(await marketDeployer.getBalance()).equals(initBalanceOfmarketDeployer.add(serviceCharge));
    console.log("market owner balance: ", initBalanceOfmarketDeployer.add(serviceCharge));

    // 7. charlie, the buyer, trys to buy another 1 of bob's listing
    initBalanceOfmarketDeployer = await marketDeployer.getBalance(); // market contract deployer's initial balance
    amountToBuy = 1;
    await zycContract.connect(charlie).approve(marketContract.address, ethers.utils.parseUnits("1", "ether")); // approve allowance
    await marketContract.connect(charlie).createMarketSale(itemId, amountToBuy, "0x", { value: serviceCharge });
    expect(await tokenContract.connect(charlie).balanceOf(charlie.address, tokenId)).equals(amountToBuy);
    marketItems = await marketContract.connect(charlie).fetchMarketItems();
    expect(marketItems.length).equals(0); // sold out
    expect(await tokenContract.connect(charlie).balanceOf(charlie.address, tokenId)).equals(1); // charlie owns 1 of token No.0
    expect(await marketDeployer.getBalance()).equals(initBalanceOfmarketDeployer.add(serviceCharge));
    // seller should receive all ZYC coins paid by buyer
    expect(await zycContract.balanceOf(bob.address)).equals(ethers.utils.parseUnits("4", "ether"));
    expect(await zycContract.balanceOf(charlie.address)).equals(ethers.utils.parseUnits("99", "ether")); // 99 ZYC coin left of charlie's balance

    // 8. verify created market items by bob
    marketItemsCreatedByBob = await marketContract.connect(bob).fetchItemsCreated(bob.address);
    expect(marketItemsCreatedByBob.length).equals(2);
    expect(marketItemsCreatedByBob[1].sold).equals(true); // sold out

    // 8: test redeposite: bob deposite 2 more tokens to market itemId 0
    await marketContract.connect(bob).depositeTokenToMarketItem(1, 2, "0x");
    marketItemsCreatedByBob = await marketContract.connect(bob).fetchItemsCreated(bob.address);
    expect(marketItemsCreatedByBob.length).equals(2);
    expect(marketItemsCreatedByBob[1].sold).to.be.false;
    expect(marketItemsCreatedByBob[1].amount).equals(2);

    // 9. john, as a seller this time, list 2 of his tokens bought before
    amountToList = 2;
    price = ethers.utils.parseUnits("2", "ether");
    await tokenContract.connect(john).setApprovalForAll(marketContract.address, true);
    await marketContract
      .connect(john)
      .createMarketItem(tokenContract.address, tokenId, amountToList, price, zycSymbol, zycContract.address, "0x");
    const marketItemsCreatedByJohn = await marketContract.connect(john).fetchItemsCreated(john.address);
    expect(marketItemsCreatedByJohn.length).equals(1);
    expect(marketItemsCreatedByJohn[0].amount).equals(2);
    expect(marketItemsCreatedByJohn[0].sold).equals(false);

    // 10. test fetchMarketItemsByToken
    // now, there should be 2 market items selling tokenId 0
    const marketItemsForToken = await marketContract.fetchMarketItemsByToken(tokenContract.address, tokenId);
    expect(marketItemsForToken.length).equals(2);

    expect(marketItemsForToken[0].amount).equals(2);
    expect(marketItemsForToken[0].seller).equals(bob.address);
    expect(marketItemsForToken[0].sold).equals(false);

    expect(marketItemsForToken[1].amount).equals(2);
    expect(marketItemsForToken[1].seller).equals(john.address);
    expect(marketItemsForToken[1].sold).equals(false);
  });
});
