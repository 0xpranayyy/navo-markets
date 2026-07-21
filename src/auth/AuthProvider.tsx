import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PrivyProvider, useFundWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { polygon } from 'viem/chains';
import type { UserProfile } from '../types';
import { setAuthBridge, type AuthBridge } from '../api/auth-bridge';
import { resetTradingClients, loadTradingSession, deriveSafeAddress, clearTradingSession } from '../api/trading/session';
import SignInSheet from '../components/auth/SignInSheet';
import { NavoMark } from '../components/brand/NavoMark';
import { useTheme } from '../theme';
import { isIos, isStandalonePwa } from '../utils/pwa';

interface AuthContextValue {
  user: UserProfile | null;
  authenticated: boolean;
  ready: boolean;
  login: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  fundWallet: () => Promise<void>;
  buildProfileForAddress: (address: string) => UserProfile | null;
  waitForWalletProfile: () => Promise<UserProfile | null>;
  openSignIn: (onSuccess?: () => void) => void;
  closeSignIn: () => void;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;

function initialsFromAddress(address: string): string {
  return address.slice(2, 4).toUpperCase();
}

function displayName(user: ReturnType<typeof usePrivy>['user'], address: string): string {
  if (user?.email?.address) return user.email.address.split('@')[0]!;
  if (user?.google?.email) return user.google.email.split('@')[0]!;
  if (user?.apple?.email) return user.apple.email.split('@')[0]!;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function buildProfile(user: ReturnType<typeof usePrivy>['user'], address: string): UserProfile {
  const name = displayName(user, address);
  return {
    id: user?.id ?? address,
    name,
    address,
    initials: name.slice(0, 2).toUpperCase() || initialsFromAddress(address),
    safeAddress: loadTradingSession(address)?.safeAddress ?? deriveSafeAddress(address),
    depositWalletAddress: loadTradingSession(address)?.safeAddress ?? deriveSafeAddress(address),
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout: privyLogout, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { fundWallet: privyFundWallet } = useFundWallet();
  const walletClientRef = useRef<WalletClient | null>(null);
  const walletsRef = useRef(wallets);
  const userRef = useRef(user);
  const signInSuccessRef = useRef<(() => void) | null>(null);
  const loginResolversRef = useRef<Array<(profile: UserProfile | null) => void>>([]);
  const [signInOpen, setSignInOpen] = useState(false);
  walletsRef.current = wallets;
  userRef.current = user;

  const embeddedWallet = useMemo(
    () => wallets.find((w) => w.walletClientType === 'privy') ?? wallets[0],
    [wallets],
  );

  const profile = useMemo<UserProfile | null>(() => {
    if (!authenticated || !embeddedWallet?.address) return null;
    return buildProfile(user, embeddedWallet.address);
  }, [authenticated, embeddedWallet?.address, user]);

  const buildProfileForAddress = useCallback((address: string) => {
    if (!userRef.current && !address) return null;
    return buildProfile(userRef.current, address);
  }, []);

  const getWalletClientInner = useCallback(async (): Promise<WalletClient | null> => {
    const wallet = walletsRef.current.find((w) => w.walletClientType === 'privy') ?? walletsRef.current[0];
    if (!wallet) return null;
    await wallet.switchChain(polygon.id);
    const provider = await wallet.getEthereumProvider();
    walletClientRef.current = createWalletClient({
      account: wallet.address as `0x${string}`,
      chain: polygon,
      transport: custom(provider),
    });
    return walletClientRef.current;
  }, []);

  const waitForWalletProfile = useCallback(async (maxMs = 15000): Promise<UserProfile | null> => {
    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline) {
      const wallet = walletsRef.current.find((w) => w.walletClientType === 'privy') ?? walletsRef.current[0];
      if (wallet?.address) {
        await getWalletClientInner();
        return buildProfile(userRef.current, wallet.address);
      }
      await sleep(150);
    }
    return null;
  }, [getWalletClientInner]);

  const getWalletClient = useCallback(async () => getWalletClientInner(), [getWalletClientInner]);

  const login = useCallback(async (): Promise<UserProfile | null> => {
    if (!ready) return null;
    if (authenticated) return waitForWalletProfile();
    return new Promise((resolve) => {
      loginResolversRef.current.push(resolve);
      setSignInOpen(true);
    });
  }, [authenticated, ready, waitForWalletProfile]);

  const openSignIn = useCallback((onSuccess?: () => void) => {
    signInSuccessRef.current = onSuccess ?? null;
    setSignInOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setSignInOpen(false);
    for (const resolve of loginResolversRef.current) resolve(null);
    loginResolversRef.current = [];
    signInSuccessRef.current = null;
  }, []);

  const handleSignInSuccess = useCallback(async () => {
    const profile = await waitForWalletProfile();
    setSignInOpen(false);
    signInSuccessRef.current?.();
    for (const resolve of loginResolversRef.current) resolve(profile);
    loginResolversRef.current = [];
    signInSuccessRef.current = null;
  }, [waitForWalletProfile]);

  const logout = useCallback(async () => {
    if (embeddedWallet?.address) clearTradingSession(embeddedWallet.address);
    walletClientRef.current = null;
    resetTradingClients();
    await privyLogout();
  }, [embeddedWallet?.address, privyLogout]);

  const fundWallet = useCallback(async () => {
    if (!embeddedWallet?.address) return;
    await privyFundWallet({ address: embeddedWallet.address, options: { chain: polygon } });
  }, [embeddedWallet?.address, privyFundWallet]);

  useEffect(() => {
    const bridge: AuthBridge = {
      login,
      logout,
      getUser: () => profile,
      getWalletClient,
      isAuthenticated: () => authenticated,
    };
    setAuthBridge(bridge);
    return () => setAuthBridge(null);
  }, [authenticated, getWalletClient, login, logout, profile]);

  const value: AuthContextValue = {
    user: profile,
    authenticated,
    ready: ready && walletsReady,
    login,
    logout,
    fundWallet,
    buildProfileForAddress,
    waitForWalletProfile,
    openSignIn,
    closeSignIn,
  };

  return (
    <AuthCtx.Provider value={value}>
      {children}
      <SignInSheet
        open={signInOpen}
        onClose={closeSignIn}
        onSuccess={handleSignInSuccess}
        buildProfile={buildProfileForAddress}
      />
    </AuthCtx.Provider>
  );
}

function MissingConfig() {
  const { colors: C } = useTheme();
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Configuration required</div>
        <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5 }}>
          Set <code style={{ color: C.blue }}>VITE_PRIVY_APP_ID</code> in <code style={{ color: C.blue }}>.env.local</code> to enable Sign in with Apple, Google, and email.
        </div>
      </div>
    </div>
  );
}

function ThemeAwarePrivy({ children }: { children: React.ReactNode }) {
  const { resolved } = useTheme();
  const privyTheme = resolved === 'light' ? 'light' as const : '#000000' as const;
  const loginPrimary = isIos() || isStandalonePwa()
    ? (['apple', 'google', 'email'] as const)
    : (['google', 'apple', 'email'] as const);

  const privyLogo = useMemo(
    () => <NavoMark size={56} base={resolved === 'dark' ? '#FFFFFF' : '#0B0C0E'} accent="#0A84FF" />,
    [resolved],
  );

  return (
    <PrivyProvider
      appId={privyAppId!}
      config={{
        loginMethods: ['email', 'google', 'apple', 'wallet'],
        loginMethodsAndOrder: {
          primary: [...loginPrimary],
        },
        appearance: {
          theme: privyTheme,
          accentColor: '#0A84FF',
          logo: privyLogo,
          landingHeader: 'Welcome to Navo',
          loginMessage: 'Trade prediction markets in seconds',
          showWalletLoginFirst: false,
          walletChainType: 'ethereum-only',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
          showWalletUIs: false,
        },
        defaultChain: polygon,
        supportedChains: [polygon],
        legal: {
          termsAndConditionsUrl: 'https://polymarket.com/tos',
          privacyPolicyUrl: 'https://polymarket.com/privacy',
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!privyAppId) {
    return <MissingConfig />;
  }

  return <ThemeAwarePrivy>{children}</ThemeAwarePrivy>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
