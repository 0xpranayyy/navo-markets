/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_POLYMARKET_GAMMA_API?: string;
  readonly VITE_POLYMARKET_CLOB_API?: string;
  readonly VITE_POLYMARKET_DATA_API?: string;
  readonly VITE_POLYMARKET_SIGN_URL?: string;
  readonly VITE_POLYMARKET_BUILDER_HEALTH_URL?: string;
  readonly VITE_POLYGON_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
