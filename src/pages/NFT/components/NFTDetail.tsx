import { ethers } from "ethers";
import * as _ from "lodash";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

import type { ListedNft, NftMetadata, NftEntity } from "../../../rpc/index";
import { getNftUri, fetchNftMetadata, fetchMarketItemsByToken, getCreator, getTokenSupply } from "../../../rpc/index";
import SellingCard from "./SellingCard";

export default function NFTDetail() {
  let { nftContract, tokenId } = useParams();
  const [marketItems, setMarketItems] = useState<ListedNft[]>([]);
  const [metadata, setMetadata] = useState<NftMetadata>({} as NftMetadata);
  const [nftEntity, setNftEntity] = useState<NftEntity>({} as NftEntity);
  const [creator, setCreator] = useState<string>("");
  const [supply, setSupply] = useState<number>(0);

  // console.log('metadata', metadata);
  // console.log('nftEntity', nftEntity);
  console.log("marketItems", marketItems);

  const getTotalAmountToSell = () => {
    let total = 0;
    marketItems.forEach((item: ListedNft) => {
      total += item.amountToSell;
    });

    return total;
  };

  useEffect(() => {
    if (!nftContract || !tokenId) {
      return;
    }

    // get metadata
    getNftUri(tokenId)
      .then((metadataUrl) => {
        const nft: NftEntity = { ...nftEntity };
        nft.metadataUrl = metadataUrl;
        nft.nftContract = nftContract || "";
        nft.tokenId = Number(tokenId);
        setNftEntity(nft);
        return fetchNftMetadata(metadataUrl);
      })
      .then((metadataRes) => {
        const nft: NftMetadata = { ...metadata };
        nft.name = metadataRes.data.name;
        nft.description = metadataRes.data.description;
        nft.image = metadataRes.data.assetUrl;
        setMetadata(nft);
      })
      .catch((error) => {
        alert(error && error.message);
      });

    // get token more details
    getCreator(nftContract, tokenId)
      .then((creator: string) => {
        setCreator(creator);
      })
      .catch((error) => {
        alert(error && error.message);
      });

    getTokenSupply(tokenId)
      .then((supply: any) => {
        setSupply(supply.toNumber());
      })
      .catch((error) => {
        alert(error && error.message);
      });
    // get market items selling this token
    fetchMarketItemsByToken(nftContract, tokenId)
      .then((items: any) => {
        const marketItemsTemp: ListedNft[] = [...marketItems];
        items.map((item: any) => {
          marketItemsTemp.push({
            marketItemId: item.itemId.toNumber(),
            tokenId: item.tokenId.toNumber(),
            price: Number(ethers.utils.formatEther(item.price)),
            nftContract: item.nftContract,
            amountToSell: item.amount.toNumber(),
            paymentTokenAddress: item.coinContract,
            paymentToken: item.coinSymbol,
            seller: item.seller,
          } as ListedNft);
        });
        setMarketItems(marketItemsTemp);
      })
      .catch((error) => {
        alert(error && error.message);
      });
  }, []);

  return (
    <div className="container w-[90%] mx-[5%] mt-[2%] min-h-screen ">
      <div className="flex flex-col">
        <div className="flex-none order-1">
          NFT Details<div className="divider"></div>
        </div>
        <div className="flex-none order-2">
          <div className="hero">
            <div className="hero-content flex-col lg:flex-row">
              <img src={metadata.image} className="max-w-sm rounded-lg shadow-2xl" />
              <div>
                <h1 className="text-5xl font-bold">{metadata.name}</h1>
                <p className="py-6">Description: {metadata.description}</p>
                <p className="py-6">Total on sale: {getTotalAmountToSell()}</p>
                <p className="py-6">Total supply: {supply}</p>
                <Link to={`/account/${creator}`}>
                  <p className="decoration-solid">Creator: {creator}</p>
                </Link>
                <p className="py-6">NFT contract: {nftEntity.nftContract}</p>
                <p className="py-6">Token Id: {nftEntity.tokenId}</p>

                <Link to="/" className="btn btn-primary">
                  Back
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-none order-3">
          <div className="divider"></div>
          <table className="table	w-full">
            <thead>
              <th>Seller</th>
              <th>price</th>
              <th>Inventory</th>
              <th>Quantity</th>
              <th>Buy</th>
            </thead>
            <tbody>
              {_.map(marketItems, (item: ListedNft, index: number) => {
                return <SellingCard item={item} key={index} />;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
