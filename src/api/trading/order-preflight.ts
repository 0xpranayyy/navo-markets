import type { ClobClient, TickSize } from '@polymarket/clob-client-v2';
import { GEOBLOCK_URL } from './constants';

export interface GeoblockResponse {
  blocked: boolean;
  ip?: string;
  country: string;
  region?: string;
}

export interface ResolvedOrderOptions {
  tickSize: string;
  negRisk: boolean;
  minOrderSize: number;
}

export async function fetchGeoblock(): Promise<GeoblockResponse> {
  const res = await fetch(GEOBLOCK_URL);
  if (!res.ok) throw new Error('Unable to verify trading eligibility');
  return res.json() as Promise<GeoblockResponse>;
}

export async function checkTradingAllowed(
  mode: 'buy' | 'sell',
  client?: ClobClient,
): Promise<void> {
  try {
    const geo = await fetchGeoblock();
    if (geo.blocked) {
      const region = geo.region ? ` (${geo.region})` : '';
      throw new Error(`Trading is not available in ${geo.country}${region}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Trading is not available')) {
      throw err;
    }
    // Geoblock check unavailable — do not block orders on network errors.
  }

  if (mode === 'buy' && client) {
    const ban = await client.getClosedOnlyMode().catch(() => null);
    if (ban?.closed_only) {
      throw new Error(
        'Your account is in close-only mode. You can sell existing positions but cannot open new ones.',
      );
    }
  }
}

export async function resolveOrderOptions(
  client: ClobClient,
  tokenId: string,
  tickSize?: string,
  negRisk?: boolean,
  conditionId?: string,
): Promise<ResolvedOrderOptions> {
  const [resolvedTick, resolvedNegRisk, marketInfo] = await Promise.all([
    tickSize ? Promise.resolve(tickSize) : client.getTickSize(tokenId),
    negRisk !== undefined ? Promise.resolve(negRisk) : client.getNegRisk(tokenId),
    conditionId
      ? client.getClobMarketInfo(conditionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const minOrderSize = marketInfo?.mos ?? 5;

  return {
    tickSize: resolvedTick,
    negRisk: resolvedNegRisk,
    minOrderSize: Number.isFinite(minOrderSize) && minOrderSize > 0 ? minOrderSize : 5,
  };
}

export function validateOrderSize(
  mode: 'buy' | 'sell',
  shares: number,
  minOrderSize: number,
): void {
  if (shares < minOrderSize) {
    const action = mode === 'sell' ? 'sell' : 'buy';
    throw new Error(`Minimum order size is ${minOrderSize} shares (${action} at least ${minOrderSize})`);
  }
}

export function toTickSize(tickSize: string): TickSize {
  return tickSize as TickSize;
}
