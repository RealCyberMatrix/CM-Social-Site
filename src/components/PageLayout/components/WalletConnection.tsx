import { useEffect, useState } from "react";
import styled from "styled-components";

import { Networks } from "../../../env";
import useWeb3Modal from "../../../hooks/useWeb3Modal";
import { formatAddress } from "../../../utils";

const StyledButton = styled.button`
  font-family: Inter;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.85);
`;

interface ButtonProps {
  label: string;
  className: string;
  onClick: () => Promise<void>;
}

interface ProfileProps {
  signedAddress: string;
  disconnection: () => Promise<void>;
  chainInfo: string;
  balance: string;
}

const Button = (props: ButtonProps) => {
  const { className, label, ...rest } = props;
  return (
    <StyledButton className={"bg-[#017ca0] rounded-lg px-4 py-3 " + className} {...rest}>
      {label}
    </StyledButton>
  );
};

const ProfileMenu = ({ signedAddress, disconnection, chainInfo, balance }: ProfileProps) => {
  return (
    <div className="dropdown dropdown-end ">
      <label tabIndex={0} className="m-1 btn bg-[#017ca0]">
        {formatAddress(signedAddress)}
      </label>
      <ul tabIndex={0} className="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52">
        <li>
          <a>
            {chainInfo} - {balance}
          </a>
        </li>
        <li>
          <a href={import.meta.env.BASE_URL + "#/account/" + signedAddress}>Profile</a>
        </li>
        <li>
          <a onClick={() => disconnection()}>Disconnect</a>
        </li>
      </ul>
    </div>
  );
};

export default function WalletConnection() {
  const { web3Modal, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, chainId, balance } = useWeb3Modal();
  const [chainInfo, setChainInfo] = useState("")

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      console.log("update chain info", chainId)
      const newChainInfo = (chainId && Networks[chainId]) || "unsupported chain";
      setChainInfo(newChainInfo)
    }
  }, [web3Modal.cachedProvider, chainId, signedInAddress])
  
  return !web3Modal.cachedProvider ? (
    <Button onClick={() => loadWeb3Modal()} label="Connect Wallet" className="" />
  ) : (
    <ProfileMenu
      signedAddress={signedInAddress}
      disconnection={() => logoutOfWeb3Modal()}
      chainInfo={chainInfo}
      balance={balance}
    />
  );
}
