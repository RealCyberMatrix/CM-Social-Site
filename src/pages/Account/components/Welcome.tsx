import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import SvgIcons from "../../../components/SvgIcons";
import { ListSellModal } from "./ListSellModal";
import type { NFT } from "../../../rpc/index";
import { fetchAllTokenIds, getNftUriBatch, fetchNftMetadata, getListedItemsBySeller, listToSell, isApproved, setApprovalForAll, getTokenBalanceBatch } from '../../../rpc/index'
import { BigNumber } from "ethers";
import useWeb3Modal from "../../../hooks/useWeb3Modal";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { clearLine } from "readline";


const FakeUser = {
  id: 1,
  address: "signedInAddress",
  bio: "Example Name",
  avatar: "https://api.lorem.space/image/face?w=150&h=150",
};

type FormValues = {
  amount: number;
  price: number;
};

function NFTSliders(props: any) {
  const { title, nftsOwned, signer, signedInAddress, userAddress } = props;
  const sliderRef = useRef<Slider | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT>();
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [marketItemId, setMarketItemId] = useState<number>(-1);

  const settings = {
    className: "ml-[5%] mr-[5%] mt-[3%] mb-[2%]",
    infinite: true,
    slidesToScroll: 1,
    speed: 500,
    rows: 2,
    slidesPerRow: 5,
    dots: true,
    arrows: true,
  };

  const startListing = (FormData: FormValues) => {
    return new Promise((resolve, reject) => {
      if (selectedNFT && selectedNFT.tokenId >= 0 && Number(FormData.amount) <= Number(selectedNFT.balance)) {
        listToSell(selectedNFT.tokenId.toString(), FormData.amount.toString(), FormData.price.toString(), signer)
       .then((listRes: any) => {
        return listRes.wait();
       }).then((listEventRes) => {
        console.log('list successfully', listEventRes.events);
        listEventRes && listEventRes.events && listEventRes.events.forEach((event: any) => {
          if (event.event === 'MarketItemCreated') {
            setMarketItemId(event.args.itemId);
          }
        })

        setInProgress(false);
        // should refresh page, since data will be changed
        setTimeout(() => {
          window.location.reload();
        }, 3000)

        // resolve(listRes); // do not resolve
       }).catch((error) => {
         reject(error)
       })
     } else {
      reject('not able to list');
     }
    })
  }

  

  const onListing = (FormData: FormValues) => {
    console.log(`token_id: ${selectedNFT?.tokenId}`);
    console.log(`amount: ${FormData.amount}`);
    console.log(`price: ${FormData.price}`);
    setInProgress(true);
    setMarketItemId(-1);
    isApproved(signedInAddress).then((isApproved) => {
      if (isApproved) {
        return startListing(FormData);
      }
      return setApprovalForAll(signer);
    }).then((approveRes: any) => {
      return approveRes.wait();
    }).then((eventsRes: any) => {
      if (eventsRes && eventsRes.events && eventsRes.events[0] && eventsRes.events[0].args && eventsRes.events[0].args.approved) {
        return startListing(FormData);
      }
    }).catch((error) => {
      setInProgress(false);
      alert(error && error.message);
    })
  };

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex-none order-1">
          <h1 className="text-4xl font-semibold leading-10	text-[#092C4C] mt-[5%] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
            {title}
          </h1>
          <div className="divider"></div>
        </div>
        <div className="flex-none order-2">
          <Slider ref={(slider) => (sliderRef.current = slider)} {...settings}>
            {nftsOwned.map((nft: any, index: number) => (
              <div key={index}>
                <img
                  src={nft.image}
                  onClick={() => {
                    if (userAddress) {
                      // redirect to nft detail page
                      // other account's profile, not connected account
                      window.location.assign(`#/nft/${nft.nftContract}/${nft.tokenId}`);
                      return;
                    }

                    if(!nft.marketItemId) {
                      // not listed token on sale
                      setIsOpen(true);
                      setSelectedNFT(nft);
                    }
                  }}
                  className="object-cover p-[3%] h-72 w-48 rounded-3xl"
                />
              </div>
            ))}
          </Slider>
          <div className="inline-grid grid-cols-10 ml-[8%] mt-[0.5%] gap-2">
            <div>
              <button
                onClick={() => {
                  sliderRef?.current?.slickPrev();
                }}
                className="btn btn-square hover:bg-slate-200  btn-sm btn-ghost disabled:bg-[#F9F9F9]"
              >
                <SvgIcons.LeftArrowIcon />
              </button>
            </div>
            <div>
              <button
                onClick={() => {
                  sliderRef?.current?.slickNext();
                }}
                className="btn btn-square hover:bg-slate-200  btn-sm btn-ghost disabled:bg-[#F9F9F9]"
              >
                <SvgIcons.RightArrowIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
      <ListSellModal
        inProgress={inProgress}
        marketItemId={marketItemId}
        nftBalance={selectedNFT ? selectedNFT.balance : 0}
        NFTlink={selectedNFT?.image}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onListing={onListing}
      />
    </div>
  );
}

export function AccountWelcome() {
  let { userAddress } = useParams();
  console.log('user address', userAddress);

  const { signer, signedInAddress } = useWeb3Modal();

  const [nftsListed, setNftsListed] = useState<NFT[]>([]);
  const [nftsOwned, setNftsOwned] = useState<NFT[]>([]); //  all tokens owned by the current user (listed token will not included)

  useEffect(() => {

    console.log('signedInAddress: ', signedInAddress);

    if (!(userAddress || signedInAddress)) {
      return;
    }

    let nfts: NFT[] = [...nftsOwned];
    
    // 1. get all tokens owned by current user
    fetchAllTokenIds().then((tokenIds: BigNumber[]) => {
      // 1.1. get balance of each token for current user
      const accounts: string[] = [];
      const ids: string[] = [];
      tokenIds.forEach((tokenId: BigNumber) => {
        nfts.push({ tokenId: tokenId.toNumber(), nftContract: import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS } as NFT);
        accounts.push(userAddress || signedInAddress || '');
        ids.push(tokenId.toNumber().toString());
      })
      return getTokenBalanceBatch(accounts, ids);
    }).then((balanceList) => {
      // 2.2 fetch metadata url for each token owned by current user
      balanceList.forEach((balance: BigNumber, index: number) => {
        nfts[index].balance = balance.toNumber();
      });
      nfts = nfts.filter(nft => nft.balance > 0);

      const ids: string[] = nfts.map((nft) => nft.tokenId.toString())
      return getNftUriBatch(ids);
    }).then((metadataUrlList: any) => {
      // 2.3 fetch metadata for each token owned by current user
      metadataUrlList.forEach((metadataUrl: any, index: number) => {
        nfts[index].metadataUrl = metadataUrl;
      })
      nfts = nfts.filter((nft: NFT) => nft.metadataUrl && nft.metadataUrl.endsWith('.json')); // metadata is a json file
      const tasks = nfts.map((nft: NFT) => {
        return fetchNftMetadata(nft.metadataUrl);
      })
      return Promise.all(tasks);
    }).then((metadataListRes) => {
      metadataListRes.forEach((metadata, index) => {
        if (metadata && metadata.data) {
          nfts[index].name = metadata.data.name;
          nfts[index].description = metadata.data.description;
          nfts[index].image = metadata.data.assetUrl;
        }
      })
      console.log('nfts owned', nfts);
      setNftsOwned(nfts)
    }).catch((error) => {
      // alert(error && error.message);
    });

    // 2. get all tokens listed by current user (listed items owned by market contract)
    let nftsListedTemp: NFT[] = [...nftsListed];
    // 2.1. get all tokens owned by current user
    getListedItemsBySeller(userAddress || signedInAddress).then((items: any) => {
      // 2.2. fetch metadata urls for listed tokens
      const ids: string[] = [];
      items.forEach((item: any) => {
        nftsListedTemp.push({ 
          tokenId: item.tokenId.toNumber(),
          marketItemId: item.itemId.toNumber(),
          price: item.price,
          nftContract: item.nftContract,
          amountToSell: item.amount,
          paymentTokenAddress: item.coinContract,
          paymentToken: item.coinSymbol,
          seller: item.seller,
        } as NFT);
        ids.push(item.tokenId.toNumber().toString());
      })
      return getNftUriBatch(ids);
    }).then((metadataUrlList) => {
      // 2.3 fetch metadata for listed tokens
      metadataUrlList.forEach((metadataUrl: any, index: number) => {
        nftsListedTemp[index].metadataUrl = metadataUrl;
      })
      nftsListedTemp = nftsListedTemp.filter((nft: NFT) => nft.metadataUrl && nft.metadataUrl.endsWith('.json')); // metadata is a json file
      const tasks = nftsListedTemp.map((nft: NFT) => {
        return fetchNftMetadata(nft.metadataUrl);
      })
      return Promise.all(tasks);
    }).then((metadataListRes) => {
      metadataListRes.forEach((metadata, index) => {
        if (metadata && metadata.data) {
          nftsListedTemp[index].name = metadata.data.name;
          nftsListedTemp[index].description = metadata.data.description;
          nftsListedTemp[index].image = metadata.data.assetUrl;
        }
      })
      console.log('nfts on sale', nftsListedTemp);
      setNftsListed(nftsListedTemp)
    }).catch((error) => {
      // alert(error && error.message);
    });

  }, [userAddress || signedInAddress]);
  
  return (
    <div className="container min-h-screen">
      <div className="flex flex-col mx-[5%] mt-[5%]">
        <div className="flex-none order-1 ">
          <div className="flex flex-row gap-[5%] ">
            <div className="flex-none order-1">
              <div className="avatar">
                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={FakeUser.avatar} />
                </div>
              </div>
            </div>
            <div className="flex-none order-2">
              <h2 className="text-xl font-medium  ">{FakeUser.bio}</h2>
              <p>Owned NFT: {nftsOwned.length}</p>
            </div>
          </div>
        </div>
        <div className="flex-none order-2">
          <NFTSliders title='NFT Owned' nftsOwned={nftsOwned} signer={signer} signedInAddress={signedInAddress} userAddress={userAddress} />
        </div>
        <div className="flex-none order-2">
          <NFTSliders title='NFT On Sale' nftsOwned={nftsListed} signer={signer} signedInAddress={signedInAddress} userAddress={userAddress} />
        </div>
      </div>
    </div>
  );
}
