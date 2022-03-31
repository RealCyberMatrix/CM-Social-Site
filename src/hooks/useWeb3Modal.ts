import { Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { useCallback, useEffect, useState } from "react";
import { Networks } from '../env' 
import { Signer, ethers } from "ethers";
import { formatPrice } from '../utils'

interface WalletListerMessage {
  accounts?: string[]
  chainId?: number
  error?: { code: number, message: string }
}

function useWeb3Modal() {
  const [connection, setConnection] = useState<any>(null);
  const [provider, setProvider] = useState<Web3Provider|null>(null);
  const [signer, setSigner] = useState<Signer|null>(null);
  const [chainId, setChainId] = useState<number|undefined>(import.meta.env.VITE_CHAIN_ID);
  const [balance, setBalance] = useState<string>("");
  const [signedInAddress, setSignedInAddress] = useState("");

  const web3Modal = new Web3Modal({
      network: Networks[import.meta.env.VITE_CHAIN_ID],
      cacheProvider: true,
  })

  const loadWeb3Modal = useCallback(async () => {
    const conn = await web3Modal.connect()
    const ethersProvider = new ethers.providers.Web3Provider(conn);
    const etherSigner = ethersProvider.getSigner()
    setConnection(conn)
    setSigner(etherSigner)
    setProvider(new Web3Provider(conn));
    setSignedInAddress(conn.selectedAddress);
  }, [web3Modal]);

  const logoutOfWeb3Modal = useCallback(async () => {
      web3Modal.clearCachedProvider();
      window.location.reload();
  }, [web3Modal]);

  const resetAccountInfo = async () => {
    setSigner(null);
    setProvider(null);
    setSignedInAddress("...");
    setChainId(0);
    setBalance("");
  }

  const setAccountInfo = async() => {
    const conn = await web3Modal.connect()
    const ethersProvider = new ethers.providers.Web3Provider(conn);
    const etherSigner = ethersProvider.getSigner()
    const newChainId = await etherSigner.getChainId() || 0
    const newBalance = await etherSigner.getBalance() || false
    const formatBalance = (newBalance && formatPrice(newBalance)) || ""
    setConnection(conn)
    setSigner(etherSigner)
    setProvider(new Web3Provider(conn));
    setSignedInAddress(conn.selectedAddress);
    setChainId(newChainId)
    setBalance(formatBalance)
  }

  const handleChainChanges = (cid: number) => {
    setAccountInfo()
  }

  const handleAccountChanges = (accounts: string[]) => {
    if (accounts.length != 0) {
      setAccountInfo()
    } else {
      resetAccountInfo()
      logoutOfWeb3Modal()
    }
  }

  const handleConnection = (cid: number) => {
    console.log("connect to chain id: ", cid)
  }

  const handleDisconnection = (error: { code: number; message: string }) => {
    console.log("disconnected from wallet, due to, error code:", error.code, error.message)
    resetAccountInfo()
  }

  useEffect(() => {
    if(connection) {
      connection.on("accountsChanged", handleAccountChanges);
      connection.on("chainChanged", handleChainChanges);
      connection.on("connection", handleConnection)
      connection.on("disconnect", handleDisconnection)

      return () => {
        connection.removeListener("accountsChanged", handleAccountChanges)
        connection.removeListener("chainChanged", handleChainChanges)
        connection.removeListener("connection", handleConnection)
        connection.removeListener("disconnect", handleDisconnection)
      }
    }
  }, [connection])

  useEffect(() => {
    if(web3Modal.cachedProvider) {
      setAccountInfo()
    }
  }, [web3Modal.cachedProvider]);

  return { web3Modal, provider, signer, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, chainId, balance };
}

/**
 * web3Modal object for creating connection or provider for rpc calls, 
 * If you need an indicator for user login or logout status, please using web3Modal.cachedProvider,
 * which is maintained by the internal library for this purpose.
 * 
 * If you need balance, account address etc, please use the export variables. 
 */
export default useWeb3Modal;
