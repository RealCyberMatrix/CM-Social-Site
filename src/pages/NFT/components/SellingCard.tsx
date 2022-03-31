import { ethers } from "ethers";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import useWeb3Modal from "../../../hooks/useWeb3Modal";
import { buy, getErc20Allowance, getErc20Balance, approveErc20 } from "../../../rpc/index";

export default function SellingCard(props: any) {
  const { signer, signedInAddress } = useWeb3Modal();
  // console.log('signedInAddress', signedInAddress);
  const [amountToBuy, setAmountToBuy] = useState<string>("0");
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [purchased, setPurchased] = useState<boolean>(false);

  const { item } = props;

  const onChange = (event: any) => {
    // console.log('event', event.target.value);
    setAmountToBuy(event.target.value);
  };

  const approveAndBuy = () => {
    return new Promise((resolve, reject) => {
      const amountToPay: number = Number(item.price) * Number(amountToBuy);
      approveErc20(amountToPay.toString(), signer)
        .then((approveTx) => {
          return approveTx.wait();
        })
        .then((eventsRes) => {
          console.log("approve events", eventsRes);
          return executeBuyAction();
        })
        .then((approveRes: any) => {
          console.log("approveRes", approveRes);
          resolve(approveRes);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const executeBuyAction = () => {
    return new Promise((resolve, reject) => {
      buy(item.marketItemId, amountToBuy, signer)
        .then((buyTx) => {
          return buyTx.wait();
        })
        .then((events) => {
          console.log("buy events", events);
          setPurchased(true);
          setInProgress(false);
          resolve(events);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const getAllowance = () => {
    return new Promise((resolve, reject) => {
      getErc20Allowance(signedInAddress)
        .then((allowed) => {
          const allowedInEther = ethers.utils.formatEther(allowed);
          resolve(allowedInEther);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const handleBuy = (event: any) => {
    // console.log(event);
    event.preventDefault();

    if (Number(amountToBuy) < 1) {
      alert("Please enter the amount of tokens to buy.");
      return;
    }

    // buy
    setInProgress(true);
    setPurchased(false);
    getErc20Balance(signedInAddress)
      .then((balance) => {
        const balanceInEther: string = ethers.utils.formatEther(balance);
        console.log("balance", balanceInEther);

        if (Number(balanceInEther) >= item.price) {
          return getAllowance();
        } else {
          throw Error(`Not enough ${item.coinSymbol} coin balance`);
        }
      })
      .then((allowed: any) => {
        console.log("allowed", allowed);
        if (Number(allowed) >= item.price) {
          return executeBuyAction();
        } else {
          return approveAndBuy();
        }
      })
      .catch((error) => {
        alert(error && error.message);
        setInProgress(false);
        setPurchased(false);
      });
  };

  return (
    <tr>
      <td>
        <Link to={`/account/${item.seller}`}>
          <p className="hover:bg-violet-100">{item.seller}</p>
        </Link>
      </td>
      <td>
        {item.price} {item.paymentToken}
      </td>
      <td>{item.amountToSell}</td>
      <td>
        <input
          type="number"
          min="1"
          max={item.amountToSell}
          name="company-website"
          id="company-website"
          className="input input-accent w-full max-w-xs"
          placeholder="Amount to buy"
          onChange={onChange}
        />
      </td>
      <td>
        <button disabled={inProgress} onClick={handleBuy} className="btn btn-primary">
          {inProgress ? "In Progress..." : "Buy"}
        </button>
      </td>

      {/* <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className=" font-extrabold tracking-tight text-gray-900">
            <Link to={`/account/${item.seller}`}>
              <p className="decoration-solid">Seller: {item.seller}</p>
            </Link>
            <span className="block">Available: {item.amountToSell}</span>
            <span className="block">
              price: {item.price} {item.paymentToken}
            </span>
          </h2>

          <div className="col-span-3 sm:col-span-2">
            <label htmlFor="company-website" className="block text-sm font-medium text-gray-900">
              Quantity
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                min="1"
                max={item.amountToSell}
                name="company-website"
                id="company-website"
                className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 text-black"
                placeholder="Amount to buy"
                onChange={onChange}
              />
            </div>
          </div>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <button
                disabled={inProgress}
                onClick={handleBuy}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {inProgress ? "In Progress..." : "Buy"}
              </button>
            </div>
          </div>
        </div>
        {purchased ? (
          <p style={{ marginLeft: "40px", color: "green" }}>Congratulations! Your purchase succeeded!</p>
        ) : null}
      </div> */}
    </tr>
  );
}
