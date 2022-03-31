import React from "react";
import { useParams } from "react-router-dom";

export function AccountProfile() {
  let { userAddress } = useParams();
  return <div>Account Profile: {userAddress}</div>;
}
