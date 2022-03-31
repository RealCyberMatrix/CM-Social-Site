import { BigNumber, ethers } from "ethers";
import * as _ from "lodash";
import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import web3 from "web3";

import SvgIcons from "../../components/SvgIcons";
import BG from "../../images/Home-BG.png";
import Post from "../../images/Home-Post.png";
import { getListedItems, getNftUriBatch, fetchNftMetadata } from "../../rpc/index";
import type { NFT } from "../../rpc/index";

const SlopLineIcon = () => {
  return (
    <svg width="38" height="33" viewBox="0 0 38 33" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line
        y1="-1"
        x2="46.9056"
        y2="-1"
        transform="matrix(-0.750472 0.660902 -0.750472 -0.660902 35.9778 0)"
        stroke="#E0E0E0"
        strokeWidth="2"
      />
    </svg>
  );
};

function PostsSlider() {
  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    className: "w-1/2 bg-base-100 mt-[20%] mb-[20%] ml-[30%] rounded-3xl",
    dotsClass: "bottom-0 slick-dots ",
    autoplay: true,
    autoplaySpeed: 2000,
    cssEase: "linear",
  };
  return (
    <div>
      <Slider {...settings}>
        <div className="card ">
          <figure>
            <img src={Post} className="w-full" />
          </figure>
          <div className="card-body pt-0">
            <h2 className="card-title">Josh</h2>
            <p>The NFT in Arab was amazing!</p>
          </div>
        </div>
        <div className="card">
          <figure>
            <img src={Post} className="w-full" />
          </figure>
          <div className="card-body pt-0">
            <h2 className="card-title">Ryan</h2>
            <p>The NFT in USA was amazing!</p>
          </div>
        </div>
        <div className="card">
          <figure>
            <img src={Post} className="w-full" />
          </figure>
          <div className="card-body pt-0">
            <h2 className="card-title">Olivia</h2>
            <p>The NFT in China was amazing!</p>
          </div>
        </div>
      </Slider>
    </div>
  );
}

function LandingSection() {
  return (
    <div
      className="bg-cover bg-no-repeat min-h-screen flex flex-row flex-wrap"
      style={{ backgroundImage: `url(${BG})` }}
    >
      <div className="flex-none order-1 basis-1/2">
        <div className="card w-1/2 ml-[10%] mt-[15%]">
          <div className="card-body">
            <h2 className="card-title font-medium text-white text-4xl">Trending</h2>
            <p className="font-normal text-white text-2xl">
              Radical fairness and transparency drive our approach to funding the future of Web3
            </p>
          </div>
        </div>
      </div>
      <div className="flex-none order-2 basis-1/2 min-w-0	">
        <PostsSlider />
      </div>
    </div>
  );
}
function GallerySection(props: any) {
  const { nftsListed } = props;
  const sliderRef = useRef<Slider | null>(null);
  const [pageCount, setpageCount] = useState(1);
  const totalPage = Math.ceil(nftsListed.length / 3);
  const settings = {
    className: "ml-[5%] mr-[5%] mt-[3%] mb-[2%]",
    // dotsClass: "slick-dots",
    // centerMode: true,
    infinite: true,
    // centerPadding: "10px",
    slidesToScroll: 1,
    speed: 500,
    slidesToShow: nftsListed.length < 3 ? 1 : 3,
    dots: false,
    arrows: false,
    // autoplay: true,
    // autoplaySpeed: 1500,
    // cssEase: "linear",
  };
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-none order-1">
        <h1 className="text-4xl font-semibold leading-10	text-[#092C4C] mt-[5%] ml-[8%] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          NFTs Gallery
        </h1>
      </div>
      <div className="flex-none order-2">
        <Slider ref={(slider) => (sliderRef.current = slider)} {...settings}>
          {nftsListed.map((nft: NFT, index: number) => (
            <Link key={index} to={`/nft/${nft.nftContract}/${nft.tokenId}`}>
              <img src={nft.image} className="object-cover p-[1%] h-72 w-48 rounded-3xl" />
            </Link>
          ))}
        </Slider>
        <div className="inline-grid grid-cols-10 ml-[8%] mt-[0.5%] gap-2">
          <div className="text-lg">{pageCount}</div>
          <div className="">
            <SlopLineIcon />
          </div>
          <div className="text-lg">{totalPage}</div>
          <div>
            <button
              onClick={() => {
                if (pageCount > 1) setpageCount(pageCount - 1);
                sliderRef?.current?.slickPrev();
              }}
              disabled={pageCount == 1}
              className="btn btn-square hover:bg-slate-200  btn-sm btn-ghost disabled:bg-[#F9F9F9]"
            >
              <SvgIcons.LeftArrowIcon />
            </button>
          </div>
          <div>
            <button
              onClick={() => {
                if (pageCount < totalPage) setpageCount(pageCount + 1);
                sliderRef?.current?.slickNext();
              }}
              disabled={pageCount == totalPage}
              className="btn btn-square hover:bg-slate-200  btn-sm btn-ghost disabled:bg-[#F9F9F9]"
            >
              <SvgIcons.RightArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [nftsListed, setNftsListed] = useState<NFT[]>([]);

  useEffect(() => {
    // 1. get all tokens listed in the market contract
    let nftsListedTemp: NFT[] = [...nftsListed];
    // 2. get all listed tokens details
    getListedItems()
      .then((items: any) => {
        // filter (two market items may sell the same token)
        const hashlist: string[] = [];
        items.forEach((item: any) => {
          const identifier: string = "".concat(item.nftContract).concat(item.tokenId.toString());
          if (!hashlist.includes(identifier)) {
            nftsListedTemp.push({
              tokenId: item.tokenId.toNumber(),
              marketItemId: item.itemId.toNumber(),
              price: Number(ethers.utils.formatEther(item.price)),
              nftContract: item.nftContract,
              amountToSell: item.amount.toNumber(),
              paymentTokenAddress: item.coinContract,
              paymentToken: item.coinSymbol,
              seller: item.seller,
            } as NFT);
            hashlist.push(identifier);
          }
        });

        const ids: string[] = nftsListedTemp.map((nft) => nft.tokenId.toString());

        // 3. fetch metadata urls for listed tokens
        return getNftUriBatch(ids);
      })
      .then((metadataUrlList) => {
        // 4. fetch metadata for listed tokens
        metadataUrlList.forEach((metadataUrl: string, index: number) => {
          nftsListedTemp[index].metadataUrl = metadataUrl;
        });
        nftsListedTemp = nftsListedTemp.filter((nft: NFT) => nft.metadataUrl && nft.metadataUrl.endsWith(".json")); // metadata is a json file
        const tasks = nftsListedTemp.map((nft: NFT) => {
          return fetchNftMetadata(nft.metadataUrl);
        });
        return Promise.all(tasks);
      })
      .then((metadataListRes) => {
        metadataListRes.forEach((metadata, index) => {
          if (metadata && metadata.data) {
            nftsListedTemp[index].name = metadata.data.name;
            nftsListedTemp[index].description = metadata.data.description;
            nftsListedTemp[index].image = metadata.data.assetUrl;
          }
        });
        console.log("nfts on sale", nftsListedTemp);
        setNftsListed(nftsListedTemp);
      })
      .catch((error) => {
        alert(error && error.message);
      });
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex-none order-1">
        <LandingSection />
      </div>
      <div className="flex-none order-2">
        <GallerySection nftsListed={nftsListed} />
      </div>
    </div>
  );
}
