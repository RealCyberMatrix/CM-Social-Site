import NftToken from '../artifacts/contracts/tokens/RealCyberMatrixERC1155Token.sol/RealCyberMatrixERC1155Token.json';
import Market from '../artifacts/contracts/exchange/ERC1155MarketWithERC20AsPayment.sol/ERC1155MarketWithERC20AsPayment.json';
import ERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import axios from 'axios';
import * as _ from 'lodash';
import { BigNumber, ethers, Signer } from "ethers";
import { FormValues } from "../../src/pages/Create/components/NFT";

export type ListedNft = { marketItemId: number, nftContract: string, price: number, amountToSell: number, paymentToken: string, paymentTokenAddress: string, seller: string }
export type NftEntity = { tokenId: number, creator: string, metadataUrl: string, nftContract: string, totalSupply: number, balance: number, owner: string}
export type NftMetadata = { name: string, description: string, image: string }
export type NFT = NftEntity & NftMetadata & ListedNft

const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_RPC_URL)
const tokenContractRead = new ethers.Contract(import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS, NftToken.abi, provider)
const marketContractRead = new ethers.Contract(import.meta.env.VITE_MARKET_CONTRCACT_ADDRESS, Market.abi, provider)
const erc20ContractRead = new ethers.Contract(import.meta.env.VITE_PAYMENT_TOKEN_CONTRACT_ADDRESS, ERC20.abi, provider)

export async function fetchAllTokenIds() { return tokenContractRead.getTokenIds() }

export async function getCreator(nftContract: string, tokenId: string) {
	if (nftContract === import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS && tokenId) {
		return tokenContractRead._creators(tokenId)
	}
	throw Error('Input error');
}
export async function getCreatorBatch(tokenIds: string[]) { return tokenContractRead.creatorBatch(tokenIds) }


export async function getNftUri(tokenId: string) { return tokenContractRead.uri(tokenId) }
export async function getNftUriBatch(tokenIds: string[]) { return tokenContractRead.uriBatch(tokenIds) }

export async function getTokenSupply(tokenId: string) { return tokenContractRead._supplies(tokenId) }
export async function getTokenSupplyBatch(tokenIds: string[]) { return tokenContractRead.supplyBatch(tokenIds) }


export async function isApproved(owner: string) {
	return tokenContractRead.isApprovedForAll(owner, import.meta.env.VITE_MARKET_CONTRCACT_ADDRESS);
}
export async function getTokenBalance(owner: string, tokenId: string) { 
	if (owner) {
		return tokenContractRead.balanceOf(owner, tokenId) 
	}
	throw Error('Please connect wallet.');
}
export async function getTokenBalanceBatch(accounts: string[], tokenIds: string[]) { return tokenContractRead.balanceOfBatch(accounts, tokenIds) }

export async function mint(signature: string, supply: string, uri: string, signer: Signer | null) {
	if (signer) {
		const tokenContractWrite = new ethers.Contract(import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS, NftToken.abi, signer);
		return await tokenContractWrite.mint(signature, supply, uri);
	}
	throw Error('Please connect wallet.');
}
export async function setApprovalForAll(signer: Signer | null) {
	if (signer) {
		const tokenContractWrite = new ethers.Contract(import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS, NftToken.abi, signer);
		return await tokenContractWrite.setApprovalForAll(import.meta.env.VITE_MARKET_CONTRCACT_ADDRESS, true);
	}
	throw Error('Please connect wallet.');
}


export async function getListedItems() { return marketContractRead.fetchMarketItems() }
export async function getListedItemsBySeller(seller: string) { 
	if (seller) {
		return marketContractRead.fetchItemsCreated(seller) 
	}
	throw Error('Please connect wallet.');
}
export async function fetchMarketItemsByToken(nftContract: string, tokenId: string) { 
	if (nftContract && tokenId) {
		return marketContractRead.fetchMarketItemsByToken(nftContract, tokenId) 
	}
}
export async function listToSell(tokenId: string, amount: string, price: string, signer: Signer | null) { 
	if (signer) {
		const marketContractWrite = new ethers.Contract(import.meta.env.VITE_MARKET_CONTRCACT_ADDRESS, Market.abi, signer);
		return marketContractWrite.createMarketItem(
			import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS,
			tokenId,
			amount,
			ethers.utils.parseUnits(price, 'ether', ),
			import.meta.env.VITE_PAYMENT_TOKEN_NAME,
			import.meta.env.VITE_PAYMENT_TOKEN_CONTRACT_ADDRESS,
			'0x') 
	}
	throw Error('Please connect wallet.');
}
export async function buy(itemId: string, amount: string, signer: Signer | null) { 
	if (signer) {
		const marketContractWrite = new ethers.Contract(import.meta.env.VITE_MARKET_CONTRCACT_ADDRESS, Market.abi, signer);
		return marketContractWrite.createMarketSale(itemId, amount, '0x', { value: ethers.utils.parseUnits(import.meta.env.VITE_SERVICE_CHARGE_IN_ETHER, 'ether') });
	}
	throw Error('Please connect wallet.');
}

export async function getErc20Balance(owner: string) { 
	if (owner) {
		return erc20ContractRead.balanceOf(owner) 
	}
	throw Error('Please connect wallet.');
}
export async function approveErc20(amount: string, signer: Signer | null) {
	if (signer) {
		const erc20ContractWrite = new ethers.Contract(import.meta.env.VITE_PAYMENT_TOKEN_CONTRACT_ADDRESS, ERC20.abi, signer);
		return erc20ContractWrite.approve(import.meta.env.VITE_MARKET_CONTRCACT_ADDRESS, ethers.utils.parseUnits(amount, 'ether'));
	}
	throw Error('Please connect wallet.');
}
export async function getErc20Allowance(owner: string) {
	if (owner) {
		return erc20ContractRead.allowance(owner, import.meta.env.VITE_MARKET_CONTRCACT_ADDRESS);
	}
	throw Error('Please connect wallet.');
}
 

export async function getSignerSignatureForMint(creator: string) { return await axios.post('/api/signature', { creator: creator }) }
export async function fetchNftMetadata(uri: string) {
	return axios({
		method: 'get',
		url: uri,
		headers: {
			'Accept': 'application/json'
		}
	})
}
export async function uploadMedia(files: Array<File>, data: FormValues) {
	const formData: FormData = new FormData();

	if (files) {
		formData.append("file", files[0]);
		formData.append("file-ext", files[0].type);
		formData.append('fileName', files[0].name);
		formData.append('name', data.name);
		formData.append('amount', data.amount);
		formData.append('description', data.description);

	}

	return axios.post('/api/upload-media',
		formData,
		{
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
}


