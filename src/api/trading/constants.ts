export const POLYGON_CHAIN_ID = 137;
export const RELAYER_URL = 'https://relayer-v2.polymarket.com/';
export const CLOB_API_URL = import.meta.env.VITE_POLYMARKET_CLOB_API ?? 'https://clob.polymarket.com';
export const SIGN_URL = import.meta.env.VITE_POLYMARKET_SIGN_URL ?? '/api/polymarket/sign';
export const BUILDER_HEALTH_URL = import.meta.env.VITE_POLYMARKET_BUILDER_HEALTH_URL ?? '/api/polymarket/health';
export const POLYGON_RPC = import.meta.env.VITE_POLYGON_RPC_URL ?? 'https://polygon-rpc.com';
export const GEOBLOCK_URL = 'https://polymarket.com/api/geoblock';

/** USDC.e on Polygon — deposit asset before wrapping to pUSD */
export const USDC_E = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as const;
/** pUSD — Polymarket V2 collateral token */
export const PUSD = '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB' as const;
export const CTF = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045' as const;

/** CTF Exchange V2 */
export const CTF_EXCHANGE_V2 = '0xE111180000d2663C0091e4f400237545B87B996B' as const;
/** Neg Risk CTF Exchange V2 */
export const NEG_RISK_EXCHANGE_V2 = '0xe2222d279d744050d28e00520010520000310F59' as const;
export const CTF_COLLATERAL_ADAPTER = '0xAdA100Db00Ca00073811820692005400218FcE1f' as const;
export const NEG_RISK_CTF_COLLATERAL_ADAPTER = '0xadA2005600Dec949baf300f4C6120000bDB6eAab' as const;

export const COLLATERAL_ONRAMP = '0x93070a847efEf7F70739046A929D47a521F5B8ee' as const;
export const COLLATERAL_OFFRAMP = '0x2957922Eb93258b93368531d39fAcCA3B4dC5854' as const;

/** @deprecated V1 — do not use for new orders */
export const CTF_EXCHANGE = CTF_EXCHANGE_V2;
/** @deprecated V1 — do not use for new orders */
export const NEG_RISK_EXCHANGE = NEG_RISK_EXCHANGE_V2;

export const SESSION_VERSION = 3;

export const PUSD_SPENDERS = [
  CTF_EXCHANGE_V2,
  NEG_RISK_EXCHANGE_V2,
  CTF_COLLATERAL_ADAPTER,
  NEG_RISK_CTF_COLLATERAL_ADAPTER,
] as const;

export const OUTCOME_SPENDERS = [
  CTF_EXCHANGE_V2,
  NEG_RISK_EXCHANGE_V2,
  CTF_COLLATERAL_ADAPTER,
  NEG_RISK_CTF_COLLATERAL_ADAPTER,
] as const;

export function getBuilderCode(): string | undefined {
  const code = import.meta.env.VITE_POLYMARKET_BUILDER_CODE as string | undefined;
  if (!code) return undefined;
  const normalized = code.startsWith('0x') ? code : `0x${code}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) return undefined;
  return normalized;
}
