import { createPublicClient, encodeFunctionData, erc20Abi, http } from 'viem';
import { polygon } from 'viem/chains';
import { OperationType, type SafeTransaction } from '@polymarket/builder-relayer-client';
import {
  CTF,
  OUTCOME_SPENDERS,
  POLYGON_RPC,
  PUSD,
  PUSD_SPENDERS,
} from './constants';

const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

const erc1155Abi = [
  {
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }, { name: 'operator', type: 'address' }],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const publicClient = createPublicClient({ chain: polygon, transport: http(POLYGON_RPC) });

async function tokenApproved(wallet: string, token: `0x${string}`, spender: string): Promise<boolean> {
  try {
    const allowance = await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [wallet as `0x${string}`, spender as `0x${string}`],
    });
    return allowance >= BigInt('1000000000000');
  } catch {
    return false;
  }
}

async function outcomeApproved(wallet: string, spender: string): Promise<boolean> {
  try {
    return await publicClient.readContract({
      address: CTF,
      abi: erc1155Abi,
      functionName: 'isApprovedForAll',
      args: [wallet as `0x${string}`, spender as `0x${string}`],
    });
  } catch {
    return false;
  }
}

export async function checkAllApprovals(tradingWalletAddress: string): Promise<boolean> {
  const checks = await Promise.all([
    ...PUSD_SPENDERS.map((s) => tokenApproved(tradingWalletAddress, PUSD, s)),
    ...OUTCOME_SPENDERS.map((s) => outcomeApproved(tradingWalletAddress, s)),
  ]);
  return checks.every(Boolean);
}

export function createApprovalTxs(): SafeTransaction[] {
  const txns: SafeTransaction[] = [];
  for (const spender of PUSD_SPENDERS) {
    txns.push({
      to: PUSD,
      operation: OperationType.Call,
      value: '0',
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, MAX_UINT256],
      }),
    });
  }
  for (const spender of OUTCOME_SPENDERS) {
    txns.push({
      to: CTF,
      operation: OperationType.Call,
      value: '0',
      data: encodeFunctionData({
        abi: erc1155Abi,
        functionName: 'setApprovalForAll',
        args: [spender as `0x${string}`, true],
      }),
    });
  }
  return txns;
}
