import type { WalletClient } from 'viem';

export const SIGN_AUTH_DOMAIN = 'navo.markets';

export function buildSignAuthMessage(
  address: string,
  authTimestamp: number,
  method: string,
  path: string,
): string {
  return `${SIGN_AUTH_DOMAIN} wants you to authorize a builder sign request.\n\nAddress: ${address}\nTimestamp: ${authTimestamp}\nMethod: ${method.toUpperCase()}\nPath: ${path}`;
}

export interface WalletSignAuth {
  address: string;
  authTimestamp: number;
  authSignature: string;
}

export async function signBuilderAuth(
  walletClient: WalletClient,
  method: string,
  path: string,
): Promise<WalletSignAuth> {
  const account = walletClient.account;
  if (!account) throw new Error('Wallet not connected');

  const authTimestamp = Math.floor(Date.now() / 1000);
  const message = buildSignAuthMessage(account.address, authTimestamp, method, path);
  const authSignature = await walletClient.signMessage({ account, message });

  return {
    address: account.address,
    authTimestamp,
    authSignature,
  };
}
