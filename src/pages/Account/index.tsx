import React from "react";
import { Outlet, Link, Route, Routes } from "react-router-dom";

import useWeb3Modal from "../../hooks/useWeb3Modal";
import { AccountProfile } from "./components/Profile";
import { AccountSettings } from "./components/Settings";
import { AccountWelcome } from "./components/Welcome";

function AccountPage() {
  const { signedInAddress } = useWeb3Modal();
  return (
    <div>
      {/* <nav>
        <Link to="/account/settings">Settings | </Link> <Link to={`/account/${signedInAddress}`}>Profile</Link>
      </nav> */}

      <Outlet />
    </div>
  );
}

export default function AccountRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AccountPage />}>
        <Route index element={<AccountWelcome />} />
        <Route path="settings" element={<AccountSettings />} />
        <Route path=":userAddress" element={<AccountWelcome />} />
      </Route>
    </Routes>
  );
}
