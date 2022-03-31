/* eslint-disable */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Market", function () {
  it("Should be able to list, unlist, buy ERC1155 tokens", async function () {
    const [marketDeployer, tokenDeployer, signer, bob, charlie, john] = await ethers.getSigners();
    const seller = [bob];
    const buyer = [john, charlie];

    console.log("market contract deployer: ", marketDeployer.address);
    console.log("token contract deployer: ", tokenDeployer.address);

    // 1. deploy market contract
    let serviceCharge = 30; // 3% service charge
    const market = await ethers.getContractFactory("ERC1155Market", marketDeployer);
    const marketContract = await market.deploy(serviceCharge);
    await marketContract.deployed();
    expect(await marketContract.getServiceCharge()).equals(serviceCharge);
    serviceCharge = 25; // 2.5% service charge
    try {
      await marketContract.connect(bob).setServiceCharge(serviceCharge);
      // should fail, bob is not market contract owner
    } catch (error) {
      expect(error).not.null;
    }
    await marketContract.connect(marketDeployer).setServiceCharge(serviceCharge);
    expect(await marketContract.getServiceCharge()).equals(serviceCharge);
    console.log("marketContract address", marketContract.address);

    // 2. deploy token contract
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

    // 3. bob mint token No.0 and allow market contract to transfer his token
    let hashData = ethers.utils.solidityKeccak256(["address", "address"], [tokenContract.address, bob.address]);
    let signature = await signer.signMessage(ethers.utils.arrayify(hashData));
    const amountToMint = 10;
    let mintTx = await tokenContract.connect(bob).mint(signature, amountToMint, "rainbow.jpg");
    const { events } = await mintTx.wait();
    const tokenId = events[0].args.id;
    expect(tokenId).to.equal(0); // token Id 0 minted
    await tokenContract.connect(bob).setApprovalForAll(marketContract.address, true);
    expect(await tokenContract.connect(bob).isApprovedForAll(bob.address, marketContract.address)).to.be.true;
    expect(await tokenContract.connect(bob).balanceOf(bob.address, tokenId)).equals(amountToMint);

    // 4. bob, the seller, try to list 3 of token No.0 for sale but then withdraw them all
    // prerequisite approve for all
    let price = ethers.utils.parseUnits(`0.001`, "ether");
    console.log("price: ", price);
    await marketContract.connect(bob).createMarketItem(tokenContract.address, tokenId, 3, price, "0x"); // list 3 tokens
    expect(await tokenContract.connect(bob).balanceOf(bob.address, tokenId)).equals(amountToMint - 3);
    let marketItems = await marketContract.connect(bob).fetchMarketItems();
    expect(marketItems.length).equals(1);
    expect(marketItems[0].nftContract).equals(tokenContract.address);
    expect(marketItems[0].tokenId).equals(tokenId);
    expect(marketItems[0].seller).equals(bob.address);
    expect(marketItems[0].amount).equals(3);
    expect(marketItems[0].price).equals(price);
    expect(marketItems[0].sold).equals(false);
    expect(marketItems[0].itemId).equals(0);
    let itemId = marketItems[0].itemId; // market item Id
    // test withdraw
    await marketContract.connect(bob).withdrawMarketItem(itemId, 1, "0x");
    expect(await tokenContract.connect(bob).balanceOf(bob.address, tokenId)).equals(amountToMint - 3 + 1);
    marketItems = await marketContract.connect(bob).fetchMarketItems();
    expect(marketItems[0].amount).equals(2);
    await marketContract.connect(bob).withdrawMarketItem(itemId, 2, "0x");
    expect(await tokenContract.connect(bob).balanceOf(bob.address, tokenId)).equals(amountToMint - 3 + 1 + 2);
    marketItems = await marketContract.connect(bob).fetchMarketItems();
    expect(marketItems.length).equals(0);
    let marketItemsCreatedByBob = await marketContract.connect(bob).fetchItemsCreated(bob.address);
    expect(marketItemsCreatedByBob[0].sold).to.be.true;

    // 5. bob, the seller, try to list 2 of token No.0 again
    await marketContract.connect(bob).createMarketItem(tokenContract.address, tokenId, 2, price, "0x");
    marketItems = await marketContract.connect(bob).fetchMarketItems();
    expect(marketItems.length).equals(1);
    expect(marketItems[0].nftContract).equals(tokenContract.address);
    expect(marketItems[0].tokenId).equals(tokenId);
    expect(marketItems[0].seller).equals(bob.address);
    expect(marketItems[0].amount).equals(2);
    expect(marketItems[0].price).equals(price);
    expect(marketItems[0].sold).equals(false);
    expect(marketItems[0].itemId).equals(1);
    itemId = marketItems[0].itemId; // market item Id 1

    // 6. john , the buyer, trys to buy 1 of bob's listing
    let initBalanceOfbob = await bob.getBalance(); // seller's initial balance
    let initBalanceOfmarketDeployer = await marketDeployer.getBalance(); // market contract deployer's initial balance
    let amountToBuy = 1;
    const buyTx = await marketContract.connect(john).createMarketSale(itemId, amountToBuy, "0x", { value: price });
    const EventResBuyTx = await buyTx.wait();
    EventResBuyTx.events.forEach((event) => {
      if (event.event == "MarketItemSold") {
        expect(event.args.seller).equals(bob.address);
        expect(event.args.buyer).equals(john.address);
        expect(event.args.amount).equals(1);
      }
    });
    expect(await tokenContract.connect(john).balanceOf(john.address, tokenId)).equals(amountToBuy);
    // verify the token transaction
    marketItems = await marketContract.connect(john).fetchMarketItems();
    expect(marketItems[0].seller).equals(bob.address);
    expect(marketItems[0].amount).equals(1);
    expect(marketItems[0].sold).equals(false); // 1 left
    expect(await tokenContract.connect(john).balanceOf(john.address, tokenId)).equals(1); // john owns 1 of token No.0
    // seller should receive the 97.5% of the money
    let totoalExpected = ethers.BigNumber.from((price / 1000) * (1000 - serviceCharge)).add(initBalanceOfbob);
    expect(await bob.getBalance()).equals(totoalExpected);
    // market contract owner should receive the 2.5% of the money
    expect(await marketDeployer.getBalance()).equals(
      ethers.BigNumber.from((price / 1000) * serviceCharge).add(initBalanceOfmarketDeployer)
    );

    // 7. charlie, the buyer, trys to buy another 1 of bob's listing
    initBalanceOfbob = await bob.getBalance(); // seller's initial balance
    initBalanceOfmarketDeployer = await marketDeployer.getBalance(); // market contract deployer's initial balance
    amountToBuy = 1;
    await marketContract.connect(charlie).createMarketSale(itemId, amountToBuy, "0x", { value: price });
    expect(await tokenContract.connect(charlie).balanceOf(charlie.address, tokenId)).equals(amountToBuy);
    marketItems = await marketContract.connect(charlie).fetchMarketItems();
    expect(marketItems.length).equals(0); // sold out
    expect(await tokenContract.connect(charlie).balanceOf(charlie.address, tokenId)).equals(1); // charlie owns 1 of token No.0
    // seller should receive the 97.5% of the money
    totoalExpected = ethers.BigNumber.from((price / 1000) * (1000 - serviceCharge)).add(initBalanceOfbob);
    expect(await bob.getBalance()).equals(totoalExpected);
    // market contract owner should receive the 2.5% of the money
    expect(await marketDeployer.getBalance()).equals(
      ethers.BigNumber.from((price / 1000) * serviceCharge).add(initBalanceOfmarketDeployer)
    );

    // 8. verify created market items by bob
    marketItemsCreatedByBob = await marketContract.connect(bob).fetchItemsCreated(bob.address);
    expect(marketItemsCreatedByBob.length).equals(2);
    expect(marketItemsCreatedByBob[1].nftContract).equals(tokenContract.address);
    expect(marketItemsCreatedByBob[1].tokenId).equals(tokenId);
    expect(marketItemsCreatedByBob[1].seller).equals(bob.address);
    expect(marketItemsCreatedByBob[1].amount).equals(0);
    expect(marketItemsCreatedByBob[1].price).equals(price);
    expect(marketItemsCreatedByBob[1].sold).equals(true); // sold out

    // 8: test redeposite: bob deposite 2 more tokens to market itemId 0
    await marketContract.connect(bob).depositeTokenToMarketItem(1, 2, "0x");
    marketItemsCreatedByBob = await marketContract.connect(bob).fetchItemsCreated(bob.address);
    expect(marketItemsCreatedByBob.length).equals(2);
    expect(marketItemsCreatedByBob[1].sold).to.be.false;
    expect(marketItemsCreatedByBob[1].amount).equals(2);

    // 9. john, as a seller this time, list 2 of his tokens bought before
    const amountToList = 1;
    price = ethers.utils.parseUnits("2", "ether");
    await tokenContract.connect(john).setApprovalForAll(marketContract.address, true);
    await marketContract.connect(john).createMarketItem(tokenContract.address, tokenId, amountToList, price, "0x");
    const marketItemsCreatedByJohn = await marketContract.connect(john).fetchItemsCreated(john.address);
    expect(marketItemsCreatedByJohn.length).equals(1);
    expect(marketItemsCreatedByJohn[0].amount).equals(1);
    expect(marketItemsCreatedByJohn[0].sold).equals(false);

    // 10. test fetchMarketItemsByToken
    // now, there should be 2 market items selling tokenId 0
    const marketItemsForToken = await marketContract.fetchMarketItemsByToken(tokenContract.address, tokenId);
    expect(marketItemsForToken.length).equals(2);

    expect(marketItemsForToken[0].amount).equals(2);
    expect(marketItemsForToken[0].seller).equals(bob.address);
    expect(marketItemsForToken[0].sold).equals(false);

    expect(marketItemsForToken[1].amount).equals(1);
    expect(marketItemsForToken[1].seller).equals(john.address);
    expect(marketItemsForToken[1].sold).equals(false);
  });
});
