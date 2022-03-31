import React from "react";
import { Outlet } from "react-router-dom";

import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";

export default function PageLayout() {
  return (
    <>
      <div className="container flex flex-col gap-0">
        <div className="order-1">
          <Navbar />
        </div>
        <div className="order-2">
          <Outlet />
        </div>
        <div className="order-3">
          <Footer />
        </div>
      </div>
    </>
  );
}
