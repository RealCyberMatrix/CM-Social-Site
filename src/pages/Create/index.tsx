import React from "react";
import { Link, Outlet, Route, Routes } from "react-router-dom";

import { CreateBlog } from "./components/Blog";
import { CreateNFT } from "./components/NFT";
import { CreatePost } from "./components/Post";

function CreatePage() {
  return (
    <div>
      {/* <div>Create Page</div>
      <nav>
        <Link to="/create/nft">NFT</Link> | <Link to="/create/post">Post</Link> | <Link to="/create/blog">Blog</Link> |
      </nav> */}
      <Outlet />
    </div>
  );
}

export default function CreateRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CreatePage />}>
        <Route path="nft" element={<CreateNFT />} />
        <Route path="post" element={<CreatePost />} />
        <Route path="blog" element={<CreateBlog />} />
      </Route>
    </Routes>
  );
}
