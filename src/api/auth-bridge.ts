import type { WalletClient } from 'viem';
import type { UserProfile } from '../types';

export interface AuthBridge {
  login(): Promise<UserProfile | null>;
  logout(): Promise<void>;
  getUser(): UserProfile | null;
  waitForWallet(): Promise<UserProfile | null>;
  getWalletClient(): Promise<WalletClient | null>;
  isAuthenticated(): boolean;
  isReady(): boolean;
}

let bridge: AuthBridge | null = null;

export function setAuthBridge(next: AuthBridge | null) {
  bridge = next;
}

export function getAuthBridge(): AuthBridge | null {
  return bridge;
}
