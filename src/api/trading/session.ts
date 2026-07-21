import {
  RelayClient,
  RelayerTransactionState,
} from '@polymarket/builder-relayer-client';
import { deriveSafe } from '@polymarket/builder-relayer-client/dist/builder/derive';
import { getContractConfig } from '@polymarket/builder-relayer-client/dist/config';
import {
  AssetType,
  ClobClient,
  SignatureTypeV2,
  type ApiKeyCreds,
} from '@polymarket/clob-client-v2';
import type { WalletClient } from 'viem';
import { checkAllApprovals, createApprovalTxs } from './approvals';
import {
  CLOB_API_URL,
  getBuilderCode,
  POLYGON_CHAIN_ID,
  RELAYER_URL,
  SESSION_VERSION,
} from './constants';
import { RemoteBuilderConfig } from './remote-builder-config';

export interface StoredTradingSession {
  version: typeof SESSION_VERSION;
  eoaAddress: string;
  /** Gnosis Safe used as Polymarket trading wallet */
  safeAddress: string;
  /** @deprecated alias */
  depositWalletAddress?: string;
  apiCredentials: ApiKeyCreds;
  ready: boolean;
}

export type SetupStep = 'relay' | 'deploy' | 'credentials' | 'approvals' | 'done';

const STORAGE_PREFIX = 'navo-trading-';
const LEGACY_STORAGE_PREFIX = 'foresight-trading-';

const RELAY_OK_STATES = [
  RelayerTransactionState.STATE_MINED,
  RelayerTransactionState.STATE_CONFIRMED,
];

function storageKey(eoa: string) {
  return STORAGE_PREFIX + eoa.toLowerCase();
}

function legacyStorageKey(eoa: string) {
  return LEGACY_STORAGE_PREFIX + eoa.toLowerCase();
}

function readStoredSessionRaw(eoaAddress: string): string | null {
  const key = storageKey(eoaAddress);
  const legacy = legacyStorageKey(eoaAddress);
  const raw = localStorage.getItem(key) ?? localStorage.getItem(legacy);
  if (raw && !localStorage.getItem(key) && localStorage.getItem(legacy)) {
    localStorage.setItem(key, raw);
    localStorage.removeItem(legacy);
  }
  return raw;
}

function parseSession(raw: string): StoredTradingSession | null {
  try {
    const parsed = JSON.parse(raw) as StoredTradingSession & { depositWalletAddress?: string };
    const safeAddress = parsed.safeAddress ?? parsed.depositWalletAddress;
    if (parsed.version !== SESSION_VERSION || !safeAddress) return null;
    return { ...parsed, safeAddress };
  } catch {
    return null;
  }
}

export function loadTradingSession(eoaAddress: string): StoredTradingSession | null {
  const raw = readStoredSessionRaw(eoaAddress);
  if (!raw) return null;
  const session = parseSession(raw);
  if (!session) {
    clearTradingSession(eoaAddress);
    return null;
  }
  return session;
}

function saveTradingSession(session: StoredTradingSession) {
  localStorage.setItem(storageKey(session.eoaAddress), JSON.stringify(session));
}

export function clearTradingSession(eoaAddress: string) {
  localStorage.removeItem(storageKey(eoaAddress));
  localStorage.removeItem(legacyStorageKey(eoaAddress));
}

function builderConfig(walletClient: WalletClient): RemoteBuilderConfig {
  return new RemoteBuilderConfig(undefined, walletClient);
}

function clobBuilderConfig() {
  const builderCode = getBuilderCode();
  return builderCode ? { builderCode } : undefined;
}

let activeClient: ClobClient | null = null;
let activeSafe: string | null = null;

export function getActiveSafeAddress(): string | null {
  return activeSafe;
}

export function getActiveDepositWalletAddress(): string | null {
  return activeSafe;
}

export function resetTradingClients() {
  activeClient = null;
  activeSafe = null;
}

export function deriveSafeAddress(eoaAddress: string): string {
  const config = getContractConfig(POLYGON_CHAIN_ID);
  return deriveSafe(eoaAddress, config.SafeContracts.SafeFactory);
}

async function pollRelay(relay: RelayClient, transactionId: string, maxPolls = 90) {
  const result = await relay.pollUntilState(
    transactionId,
    RELAY_OK_STATES,
    RelayerTransactionState.STATE_FAILED,
    maxPolls,
    3000,
  );
  if (!result) throw new Error('Relayer transaction failed or timed out');
  return result;
}

function createTradingClient(
  walletClient: WalletClient,
  apiCredentials: ApiKeyCreds,
  safeAddress: string,
): ClobClient {
  return new ClobClient({
    host: CLOB_API_URL,
    chain: POLYGON_CHAIN_ID,
    signer: walletClient,
    creds: apiCredentials,
    signatureType: SignatureTypeV2.POLY_GNOSIS_SAFE,
    funderAddress: safeAddress,
    builderConfig: clobBuilderConfig(),
  });
}

export async function initializeTradingSession(
  eoaAddress: string,
  walletClient: WalletClient,
  onStep?: (step: SetupStep) => void,
): Promise<StoredTradingSession> {
  onStep?.('relay');
  const relay = new RelayClient(RELAYER_URL, POLYGON_CHAIN_ID, walletClient, builderConfig(walletClient) as never);
  const safeAddress = deriveSafeAddress(eoaAddress);

  onStep?.('deploy');
  const deployed = await relay.getDeployed(safeAddress);
  if (!deployed) {
    const response = await relay.deploy();
    await pollRelay(relay, response.transactionID);
  }

  onStep?.('credentials');
  const bootstrap = new ClobClient({ host: CLOB_API_URL, chain: POLYGON_CHAIN_ID, signer: walletClient });
  const apiCredentials = await bootstrap.createOrDeriveApiKey().catch(async () => bootstrap.createApiKey());

  onStep?.('approvals');
  const approved = await checkAllApprovals(safeAddress);
  if (!approved) {
    const response = await relay.execute(createApprovalTxs(), 'Navo pUSD approvals');
    await pollRelay(relay, response.transactionID);
  }

  const session: StoredTradingSession = {
    version: SESSION_VERSION,
    eoaAddress,
    safeAddress,
    apiCredentials,
    ready: true,
  };
  saveTradingSession(session);

  activeClient = createTradingClient(walletClient, apiCredentials, safeAddress);
  activeSafe = safeAddress;

  onStep?.('done');
  return session;
}

export async function getTradingClient(
  eoaAddress: string,
  walletClient: WalletClient,
): Promise<{ client: ClobClient; safeAddress: string }> {
  if (activeClient && activeSafe) {
    return { client: activeClient, safeAddress: activeSafe };
  }

  const stored = loadTradingSession(eoaAddress);
  if (stored?.ready) {
    activeClient = createTradingClient(walletClient, stored.apiCredentials, stored.safeAddress);
    activeSafe = stored.safeAddress;
    return { client: activeClient, safeAddress: activeSafe };
  }

  const session = await initializeTradingSession(eoaAddress, walletClient);
  return { client: activeClient!, safeAddress: session.safeAddress };
}

export async function syncCollateralBalance(client: ClobClient): Promise<number> {
  await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => {});
  const balance = await client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
  return parseInt(balance.balance, 10) / 1e6;
}
