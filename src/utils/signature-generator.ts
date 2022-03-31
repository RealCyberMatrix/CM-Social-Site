import { ethers } from "ethers";

// msgSender: token creator
export default async function getSignature(msgSender: string){
    const contractAddress: any = process.env.VITE_TOKEN_CONTRACT_ADDRESS;
    const hexPrivateKey: any = process.env.PRIVATE_KEY;

    // console.log('contractAddress', contractAddress);
    // console.log('hexPrivateKey', hexPrivateKey);
    // console.log('msgSender', msgSender);

    const hashData = ethers.utils.solidityKeccak256(["address", "address"], [contractAddress, msgSender]);

    const wallet = new ethers.Wallet(hexPrivateKey);
    const signature = await wallet.signMessage(ethers.utils.arrayify(hashData));

    return signature;
}

// module.exports = {
//     getSignature: getSignature
// }


// for test
// (async() => {
//     const signature = await getSignature("0x96eD022D9bd064A1c7941aee41E03f970EB291Ab");
//     console.log("signature", signature); 

// })();

// Q: How to run this file?
// A: 1. set PRIVATE_KEY to .env; 2. yarn hardhat run src/utils/signature-generator.js 
// confusion: not sure why node src/utils/signature-generator.js  does not work