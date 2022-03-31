/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly VITE_CHAIN_ID: number;
  readonly VITE_RPC_URL: string;
  readonly VITE_MARKET_CONTRCACT_ADDRESS: string;
  readonly VITE_TOKEN_CONTRACT_ADDRESS: string;
  readonly VITE_PAYMENT_TOKEN_CONTRACT_ADDRESS: string;
  readonly VITE_DEPLOYER_ADDRESS: string;
  readonly VITE_DEPLOYER_PRIVATE_KEY: string;
  readonly VITE_SERVICE_CHARGE_IN_ETHER: string;
}

interface Window {
  ethereum: any
}