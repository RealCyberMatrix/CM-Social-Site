import React from "react";
import { Outlet, Route, Routes } from "react-router";

import NFTDetail from "./components/NFTDetail";
import NFTList from "./components/NFTList";

function NFTPage() {
  return (
    <>
      <Outlet />
    </>
  );
}

export default function NFTRoutes() {
  return (
    <Routes>
      <Route path="/" element={<NFTPage />}>
        <Route index element={<NFTList />} />
        <Route path=":nftContract/:tokenId" element={<NFTDetail />} />
      </Route>
    </Routes>
  );
}
