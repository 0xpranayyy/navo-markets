import { getBuilderCode } from './trading/constants';

const BRIDGE_URL = 'https://bridge.polymarket.com';

export interface BridgeDepositAddresses {
  evm: string;
  svm?: string;
  btc?: string;
  tron?: string;
  note?: string;
}

/** Per-user Polymarket bridge deposit addresses (USDC → pUSD in trading wallet). */
export async function fetchBridgeDepositAddresses(
  tradingWalletAddress: string,
): Promise<BridgeDepositAddresses> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const builderCode = getBuilderCode();
  if (builderCode) headers['X-Builder-Code'] = builderCode;

  const res = await fetch(`${BRIDGE_URL}/deposit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ address: tradingWalletAddress }),
  });

  if (!res.ok) {
    let detail = `Bridge error (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      detail = data.error ?? data.message ?? detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  const data = (await res.json()) as { address?: BridgeDepositAddresses; note?: string };
  const addr = data.address;
  if (!addr?.evm) throw new Error('Bridge did not return a deposit address');
  return { ...addr, note: data.note };
}
