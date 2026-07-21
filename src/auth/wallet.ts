import type { WalletListEntry } from '@privy-io/react-auth';
import type { usePrivy, useWallets } from '@privy-io/react-auth';

type PrivyUser = ReturnType<typeof usePrivy>['user'];
type ConnectedWallet = ReturnType<typeof useWallets>['wallets'][number];

/** Wallets shown in Privy connect/login modals for EVM sign-in. */
export const PRIVY_WALLET_LIST: WalletListEntry[] = [
  'detected_ethereum_wallets',
  'metamask',
  'coinbase_wallet',
  'rainbow',
  'wallet_connect',
];

/** Linked EVM wallet address from Privy user (embedded or external). */
export function linkedWalletAddress(user: PrivyUser): string | undefined {
  return user?.wallet?.address ?? undefined;
}

/**
 * Pick the wallet the app should trade with: Privy embedded first, then the
 * wallet explicitly linked to the Privy user — never an unlinked extension.
 */
export function pickTradingWallet(
  wallets: ConnectedWallet[],
  user: PrivyUser,
): ConnectedWallet | undefined {
  const embedded = wallets.find((w) => w.walletClientType === 'privy');
  if (embedded) return embedded;
  const linked = linkedWalletAddress(user)?.toLowerCase();
  if (!linked) return undefined;
  return wallets.find((w) => w.address?.toLowerCase() === linked);
}

/** Address to use after sign-in (embedded, linked external, or user.wallet). */
export function resolveLoginAddress(
  wallets: ConnectedWallet[],
  user: PrivyUser,
): string | undefined {
  return pickTradingWallet(wallets, user)?.address ?? linkedWalletAddress(user);
}
