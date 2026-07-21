import { createPublicClient, encodeFunctionData, erc20Abi, http, parseAbi } from 'viem';
import { polygon } from 'viem/chains';
import type { WalletClient } from 'viem';
import {
  OperationType,
  RelayClient,
  RelayerTransactionState,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import {
  COLLATERAL_OFFRAMP,
  COLLATERAL_ONRAMP,
  POLYGON_CHAIN_ID,
  POLYGON_RPC,
  PUSD,
  RELAYER_URL,
  USDC_E,
} from './constants';
import { RemoteBuilderConfig } from './remote-builder-config';

const publicClient = createPublicClient({ chain: polygon, transport: http(POLYGON_RPC) });

const onrampAbi = parseAbi([
  'function wrap(address _asset, address _to, uint256 _amount)',
]);

const offrampAbi = parseAbi([
  'function unwrap(address _asset, address _to, uint256 _amount)',
]);

const RELAY_OK = [
  RelayerTransactionState.STATE_MINED,
  RelayerTransactionState.STATE_CONFIRMED,
];

async function pollRelay(relay: RelayClient, transactionId: string) {
  const result = await relay.pollUntilState(
    transactionId,
    RELAY_OK,
    RelayerTransactionState.STATE_FAILED,
    90,
    3000,
  );
  if (!result) throw new Error('Relayer transaction failed or timed out');
  return result;
}

function relayClient(walletClient: WalletClient) {
  return new RelayClient(RELAYER_URL, POLYGON_CHAIN_ID, walletClient, new RemoteBuilderConfig(undefined, walletClient) as never);
}

export async function getUsdcBalance(address: string): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_E,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return Number(balance) / 1e6;
  } catch {
    return 0;
  }
}

export async function getPusdBalance(address: string): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: PUSD,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return Number(balance) / 1e6;
  } catch {
    return 0;
  }
}

/**
 * Move USDC.e from Privy EOA into the Safe and wrap to pUSD for CLOB trading.
 */
export async function fundTradingWallet(
  walletClient: WalletClient,
  eoaAddress: string,
  safeAddress: string,
): Promise<{ hash?: string; txId?: string; amount: number } | null> {
  const balance = await getUsdcBalance(eoaAddress);
  if (balance < 0.5) return null;

  const transferAmount = BigInt(Math.floor(balance * 1e6));

  const hash = await walletClient.writeContract({
    address: USDC_E,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [safeAddress as `0x${string}`, transferAmount],
    account: eoaAddress as `0x${string}`,
    chain: polygon,
  });

  const wrapTxns: SafeTransaction[] = [
    {
      to: USDC_E,
      operation: OperationType.Call,
      value: '0',
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [COLLATERAL_ONRAMP, transferAmount],
      }),
    },
    {
      to: COLLATERAL_ONRAMP,
      operation: OperationType.Call,
      value: '0',
      data: encodeFunctionData({
        abi: onrampAbi,
        functionName: 'wrap',
        args: [USDC_E, safeAddress as `0x${string}`, transferAmount],
      }),
    },
  ];

  const relay = relayClient(walletClient);
  const response = await relay.execute(wrapTxns, 'Navo wrap USDC to pUSD');
  await pollRelay(relay, response.transactionID);

  return { hash, txId: response.transactionID, amount: balance };
}

/** Withdraw pUSD from Safe → USDC.e on the owner EOA. */
export async function withdrawFromTradingWallet(
  walletClient: WalletClient,
  safeAddress: string,
  eoaAddress: string,
  amountUsd?: number,
): Promise<{ txId: string; amount: number } | null> {
  const walletPusd = await getPusdBalance(safeAddress);
  if (walletPusd < 0.5) return null;

  const amount = amountUsd != null ? Math.min(amountUsd, walletPusd) : walletPusd;
  if (amount < 0.5) return null;

  const unwrapAmount = BigInt(Math.floor(amount * 1e6));

  const withdrawTxns: SafeTransaction[] = [
    {
      to: PUSD,
      operation: OperationType.Call,
      value: '0',
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [COLLATERAL_OFFRAMP, unwrapAmount],
      }),
    },
    {
      to: COLLATERAL_OFFRAMP,
      operation: OperationType.Call,
      value: '0',
      data: encodeFunctionData({
        abi: offrampAbi,
        functionName: 'unwrap',
        args: [USDC_E, eoaAddress as `0x${string}`, unwrapAmount],
      }),
    },
  ];

  const relay = relayClient(walletClient);
  const response = await relay.execute(withdrawTxns, 'Navo unwrap pUSD to USDC');
  await pollRelay(relay, response.transactionID);

  return { txId: response.transactionID, amount };
}

/** @deprecated */
export const fundDepositWallet = fundTradingWallet;
/** @deprecated */
export const withdrawFromDepositWallet = withdrawFromTradingWallet;
/** @deprecated */
export const transferUsdcToSafe = fundTradingWallet;
/** @deprecated */
export const transferUsdcFromSafe = withdrawFromTradingWallet;
