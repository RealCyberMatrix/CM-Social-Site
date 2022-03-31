import React, { useEffect, useState } from "react";
import * as _ from 'lodash' 
import { fetchAllTokenIds, getNftUriBatch, getTokenSupplyBatch, getCreatorBatch, fetchNftMetadata } from '../../../rpc/index'
import type { NFT } from "../../../rpc/index";
import { BigNumber } from "ethers";
import Image from "./Image";

function NFTCard(props: NFT) {
  // const formattedPrice = formatPrice(props.price)
  return (
    <div className="bg-base-100 shadow-xl card">
      <figure className="px-4 pt-4">
        <Image src={props.image} alt={props.name} className="mask mask-sircleu object-contain w-auto h-60" />
      </figure>
      <div className="card-body">
        <h2 className="my-2 text-4xl font-bold card-title">{props.name}</h2>
        <p>Description: {props.description}</p>
        <p>Token Id: {props.tokenId}</p>
        <p>Creator: {props.creator}</p>
        <p>Supply: {props.totalSupply}</p>
      </div>
    </div>
  )
}

export default function NFTList() {
  const [nftList, setNFTs] = useState<NFT[]>([])


  useEffect(() => {
    let nfts = [...nftList];
    let ids: string[];
    //  1. get all nft token ids
    fetchAllTokenIds().then((nftIdList: any) => {
      // 2. get all nft token metadata urls
      
      ids = _.map(nftIdList, (tokenId: BigNumber) => {
        nfts.push({ tokenId: tokenId.toNumber(), nftContract: import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS } as NFT);
        return tokenId.toNumber().toString();
      })

      return getCreatorBatch(ids);
    }).then((creators) => {
      creators.forEach((creator: string, index: number) => {
        nfts[index].creator = creator;
      })
      return getTokenSupplyBatch(ids);
    }).then((supplies) => {
      supplies.forEach((supply: BigNumber, index: number) => {
        nfts[index].totalSupply = supply.toNumber();
      })
      return getNftUriBatch(ids);
    }).then((metadataUrlList: any) => {
      // 3. fetch metadata
      // console.log('metadata url list', metadataUrlList);
      metadataUrlList.forEach((metadataUrl: string, index: number) => {
        nfts[index].metadataUrl = metadataUrl;
      })
      nfts = nfts.filter((nft: NFT) => nft.metadataUrl && nft.metadataUrl.endsWith('.json')); // metadata is a json file
      const tasks = nfts.map((nft: NFT) => {
        return fetchNftMetadata(nft.metadataUrl);
      })
      return Promise.all(tasks);
    }).then((metadataListRes) => {
      // console.log('metadata list res', metadataListRes);
      metadataListRes.forEach((metadata, index) => {
        if (metadata && metadata.data) {
          nfts[index].name = metadata.data.name;
          nfts[index].description = metadata.data.description;
          nfts[index].image = metadata.data.assetUrl;
        }
      })
      setNFTs(nfts)
    }).catch((error) => {
      alert(error && error.message);
    });
  }, [])

  return (<div className="grid grid-cols-4 gap-4">
    {
      _.map(nftList, (nft: NFT, idx: number) => { return <NFTCard key={idx} {...nft} />})
    }
  </div>)
}
