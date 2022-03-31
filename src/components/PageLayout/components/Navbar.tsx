import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import LOGO from "../../../images/LOGO_m.png";
import SvgIcons from "../../SvgIcons";
import WalletConnection from "./WalletConnection";

const LogoLink = styled(Link)`
  font-family: Inter;
  font-style: normal;
  font-weight: bold;
  font-size: 24px;
  color: #000000;
`;

const NavLink = styled(Link)`
  font-family: Inter;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 24px;
`;

function MenuList() {
  return (
    <>
      <li>
        <NavLink to="/create/nft">Create</NavLink>
      </li>
      <li>
        <NavLink to="/gallery">Gallery</NavLink>
      </li>
      <li>
        <NavLink to="/account">Profile</NavLink>
      </li>
      <li>
        <NavLink to="/">About</NavLink>
      </li>
    </>
  );
}

export function Navbar() {
  return (
    <div className="navbar bg-base-100 space-x-5">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <SvgIcons.MenuExpander />
          </label>
          <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            <li className="form-control">
              <input type="text" placeholder="Search" className="input bg-[#F4F4F4] rounded-xl" />
            </li>
            <MenuList />
          </ul>
        </div>
        <LogoLink className="flex items-center" to="/">
          <img className="pr-2" src={LOGO} />
          Cyber Matrix
        </LogoLink>
      </div>
      <div className="navbar-center justify-center hidden lg:flex">
        <div className="grow form-control">
          <input type="text" placeholder="Search" className="input bg-[#F4F4F4] rounded-xl" />
        </div>
        <ul className="menu menu-horizontal justify-end p-0">
          <MenuList />
        </ul>
      </div>
      <div className="navbar-end">
        <WalletConnection />
      </div>
    </div>
  );
}
