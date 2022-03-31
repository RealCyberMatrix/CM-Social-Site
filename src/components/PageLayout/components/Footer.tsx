import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import LOGO from "../../../images/LOGO_m.png";
import SvgIcons from "../../SvgIcons";

const StyledContent = styled.div`
  font-family: Roboto;
  font-style: normal;
  letter-spacing: 0.03em;
  color: #ffffff;
`;

export function Footer() {
  return (
    <footer className="p-10 footer bg-[#018AAF] text-base-content">
      <div>
        <img src={LOGO} className="ml-3" />
        <div className="text-2xl font-bold text-white">Cyber Matrix</div>
      </div>
      <StyledContent>
        <span className="footer-title font-bold	">Information</span>
        <Link to="/create" className="link link-hover text-sm font-medium">
          Create
        </Link>
        <Link to="/following" className="link link-hover text-sm font-medium">
          Follow
        </Link>
        <Link to="/account" className="link link-hover text-sm font-medium">
          Profile
        </Link>
        <Link to="/nft" className="link link-hover text-sm font-medium">
          Wallet
        </Link>
        <Link to="/" className="link link-hover text-sm font-medium">
          Legal
        </Link>
      </StyledContent>

      <StyledContent>
        <span className="footer-title font-bold	">Contacts</span>
        <div className="flex gap-2">
          <SvgIcons.LocationIcon />
          <p> 1234 Sample Street Cupertino, CA 95014</p>
        </div>
        <div className="flex gap-2">
          <SvgIcons.PhoneIcon />
          <p>408.222.3333</p>
        </div>
        <div className="flex gap-2">
          <SvgIcons.MailIcon />
          <p>sampleemail@gmail.com</p>
        </div>
      </StyledContent>
      <StyledContent>
        <span className="footer-title font-bold	">Social Media</span>
        <div className="grid grid-flow-col gap-4">
          <SvgIcons.YoutubeIcon />
          <SvgIcons.TwitterIcon />
          <SvgIcons.LinkedinIcon />
          <SvgIcons.PinterestIcon />
          <SvgIcons.InsIcon />
        </div>
      </StyledContent>
    </footer>
  );
}
