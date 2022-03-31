export const Networks: Record<number, string> = {
  // 1: "mainnet",
  // 3: "ropsten",
  // 4: "rinkeby",
  137: "matic",
  80001: "mumbai",
};

export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID