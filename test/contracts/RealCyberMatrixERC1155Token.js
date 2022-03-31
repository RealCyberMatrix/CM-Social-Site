/* eslint-disable */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealCyberMatrixERC1155Token", function () {
  it("Should be able to mint, transfer", async function () {
    const [deployer, signer, bob, charlie, john] = await ethers.getSigners();
    const users = [bob, charlie];

    console.log("deployer: ", deployer.address);
    console.log("signer: ", signer.address);

    const realCyberMatrixERC1155TokenFactory = await ethers.getContractFactory("RealCyberMatrixERC1155Token", deployer);
    const contract = await realCyberMatrixERC1155TokenFactory.deploy(
      "RealCyberMatrix",
      "RCM",
      signer.address,
      "https://terry0.s3.us-west-1.amazonaws.com/test/",
      ""
    );

    await contract.deployed();

    expect(await contract.name()).to.equal("RealCyberMatrix");
    expect(await contract.symbol()).to.equal("RCM");

    // signer has to be in a signer role
    expect(await contract.hasRole(await contract.SIGNER_ROLE(), signer.address)).to.be.true;
    let tokenIds = await contract.getTokenIds();
    expect(tokenIds.length).to.equal(0);

    // user bob mints token No.0
    // 1. generate signer's signature
    // bob is about to mint token
    let hashData = ethers.utils.solidityKeccak256(["address", "address"], [contract.address, bob.address]);
    let signature = await signer.signMessage(ethers.utils.arrayify(hashData));
    // console.log("signature: ", signature);
    // 2. user bob calls mint() function
    let mintTx = await contract.connect(bob).mint(signature, 10, "rainbow.json");
    const { events } = await mintTx.wait();
    expect(events[0].event).to.equal("TransferSingle"); // event1: TransferSingle
    expect(events[1].event).to.equal("URI"); // event2: URI
    expect(events[0].args.id).to.equal(0);
    expect(await contract.uri(0)).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/rainbow.json");
    expect(await contract.balanceOf(bob.address, 0)).to.equal(10);

    // user charlie mints token No.1
    hashData = ethers.utils.solidityKeccak256(["address", "address"], [contract.address, charlie.address]);
    signature = await signer.signMessage(ethers.utils.arrayify(hashData));
    mintTx = await contract.connect(charlie).mint(signature, 5, "volcano.json");
    let result = await mintTx.wait();
    expect(result.events[0].event).to.equal("TransferSingle");
    expect(result.events[1].event).to.equal("URI");
    expect(result.events[0].args.id).to.equal(1);
    expect(await contract.uri(1)).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/volcano.json");
    expect(await contract.balanceOf(charlie.address, 1)).to.equal(5);

    // user john mints token No.2
    hashData = ethers.utils.solidityKeccak256(["address", "address"], [contract.address, john.address]);
    signature = await signer.signMessage(ethers.utils.arrayify(hashData));
    mintTx = await contract.connect(john).mint(signature, 9, "river.json");
    result = await mintTx.wait();
    expect(result.events[0].event).to.equal("TransferSingle");
    expect(result.events[1].event).to.equal("URI");
    expect(result.events[0].args.id).to.equal(2);
    expect(await contract.uri(2)).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/river.json");
    expect(await contract.balanceOf(john.address, 2)).to.equal(9);

    // fetch all token ids
    tokenIds = await contract.getTokenIds();
    expect(tokenIds.length).to.equal(3);
    expect(tokenIds[0]).to.equal(0);
    expect(tokenIds[1]).to.equal(1);
    expect(tokenIds[2]).to.equal(2);

    // get uri batch
    let uris = await contract.uriBatch([0, 1, 2]);
    expect(uris[0]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/rainbow.json");
    expect(uris[1]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/volcano.json");
    expect(uris[2]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/river.json");
    uris = await contract.uriBatch([0, 2]);
    expect(uris[0]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/rainbow.json");
    expect(uris[1]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/river.json");
    uris = await contract.uriBatch([0, 2, 5]);
    expect(uris[0]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/rainbow.json");
    expect(uris[1]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/river.json");
    expect(uris[2]).to.equal("https://terry0.s3.us-west-1.amazonaws.com/test/");

    // get supply batch
    let supplies = await contract.supplyBatch([0, 2]);
    expect(supplies[0]).to.equal(10);
    expect(supplies[1]).to.equal(9);
    supplies = await contract.supplyBatch([0, 2, 5]);
    expect(supplies[0]).to.equal(10);
    expect(supplies[1]).to.equal(9);
    expect(supplies[2]).to.equal(0);

    // get creators batch
    let creators = await contract.creatorBatch([0, 2]);
    expect(creators[0]).to.equal(bob.address);
    expect(creators[1]).to.equal(john.address);
    creators = await contract.creatorBatch([0, 2, 5]);
    expect(creators[0]).to.equal(bob.address);
    expect(creators[1]).to.equal(john.address);
    expect(creators[2]).to.equal("0x0000000000000000000000000000000000000000");

    // should be able to burn
    // bob burns token No.0
    let burnTx = await contract.connect(bob).burn(bob.address, 0, 10);
    await mintTx.wait();
    expect(await contract.balanceOf(bob.address, 0)).to.equal(0);
    tokenIds = await contract.getTokenIds();
    expect(tokenIds.length).to.equal(2);
    expect(tokenIds[0]).to.equal(1); // only token No.1 is there, but token No.0 get burned totally
    const amount = await contract._supplies(0);
    expect(amount).to.equal(0);
  });
});
