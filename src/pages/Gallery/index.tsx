import { BigNumber } from "ethers";
import * as _ from "lodash";
import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import {
  fetchAllTokenIds,
  getNftUriBatch,
  getTokenSupplyBatch,
  getCreatorBatch,
  fetchNftMetadata,
} from "../../rpc/index";
import type { NFT } from "../../rpc/index";

type galleryData = {
  tokenIDs: string[];
  nftList: NFT[];
  curIndex: number;
};

export default function Gallery() {
  const [hasMore, setHasmore] = useState(true);
  const fetchThreshold = 1;
  const [data, setData] = useState<galleryData>({ tokenIDs: [], nftList: [], curIndex: 0 });

  useEffect(() => {
    let nfts = [...data.nftList];
    let ids: string[];
    //  1. get all nft token ids
    fetchAllTokenIds()
      .then((nftIdList: any) => {
        // 2. get all nft token metadata urls
        ids = _.map(nftIdList, (tokenId: BigNumber) => {
          return tokenId.toNumber().toString();
        });
        ids = ids.reverse();
        ids.slice(0, fetchThreshold).forEach((tokenId: string) => {
          nfts.push({ tokenId: Number(tokenId), nftContract: import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS } as NFT);
        });
        console.log("idlist ", ids);
        return getNftUriBatch(ids.slice(0, fetchThreshold));
      })
      .then((metadataUrlList: any) => {
        // 3. fetch metadata
        metadataUrlList.forEach((metadataUrl: string, index: number) => {
          nfts[index].metadataUrl = metadataUrl;
        });
        nfts = nfts.filter((nft: NFT) => nft.metadataUrl && nft.metadataUrl.endsWith(".json")); // metadata is a json file
        const tasks = nfts.map((nft: NFT) => {
          return fetchNftMetadata(nft.metadataUrl);
        });
        return Promise.all(tasks);
      })
      .then((metadataListRes) => {
        metadataListRes.forEach((metadata, index) => {
          if (metadata && metadata.data) {
            nfts[index].name = metadata.data.name;
            nfts[index].description = metadata.data.description;
            nfts[index].image = metadata.data.assetUrl;
          }
        });
        console.log("nfts ", nfts);
        setData({ tokenIDs: ids, nftList: nfts, curIndex: fetchThreshold });
        console.log("data", data);
      })
      .catch((error) => {
        alert(error && error.message);
      });
  }, []);

  const fectchMoreData = () => {
    let curIDs = data.tokenIDs.slice(data.curIndex, data.curIndex + fetchThreshold);
    let nfts: NFT[] = [];
    if (data.nftList.length >= data.tokenIDs.length) {
      setHasmore(false);
      return;
    } else {
      curIDs.forEach((tokenId: string) => {
        nfts.push({ tokenId: Number(tokenId), nftContract: import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS } as NFT);
      });
      getNftUriBatch(curIDs)
        .then((metadataUrlList: any) => {
          // fetch metadata
          metadataUrlList.forEach((metadataUrl: string, index: number) => {
            nfts[index].metadataUrl = metadataUrl;
          });
          nfts = nfts.filter((nft: NFT) => nft.metadataUrl && nft.metadataUrl.endsWith(".json")); // metadata is a json file
          const tasks = nfts.map((nft: NFT) => {
            return fetchNftMetadata(nft.metadataUrl);
          });
          return Promise.all(tasks);
        })
        .then((metadataListRes) => {
          metadataListRes.forEach((metadata, index) => {
            if (metadata && metadata.data) {
              nfts[index].name = metadata.data.name;
              nfts[index].description = metadata.data.description;
              nfts[index].image = metadata.data.assetUrl;
            }
          });
          console.log("nfts ", nfts);
          setData({
            tokenIDs: data.tokenIDs,
            nftList: data.nftList.concat(nfts),
            curIndex: data.curIndex + fetchThreshold,
          });
          console.log("data", data);
        })
        .catch((error) => {
          alert(error && error.message);
        });
    }
  };

  return (
    <div className="grid grid-cols-1 w-[90%] mx-[5%] mt-[1%] min-h-screen">
      <div className="divider"></div>
      <InfiniteScroll
        dataLength={data.nftList.length}
        next={fectchMoreData}
        hasMore={hasMore}
        loader={<h4>Loading...</h4>}
        endMessage={
          <p className="text-center">
            <b>Yay! You have seen it all</b>
          </p>
        }
      >
        <div className="grid grid-cols-1 gap-[1%]">
          {data.nftList.map((nft, index) => {
            return (
              <div key={index} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">{nft.name}</h2>
                  <p>{nft.description}</p>
                </div>
                <figure>
                  <img className="object-cover h-96 w-96" src={nft.image} alt={nft.name} />
                </figure>
              </div>
            );
          })}
        </div>
      </InfiniteScroll>
    </div>
  );
}
