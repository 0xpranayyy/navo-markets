import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import type { Market, Order, Phase, Position, Tab, TicketInfo, ToastMsg, OpenOrder } from '../types';
import { api } from '../api/client';
import { resolveTokenId } from '../api/polymarket';
import { marketPriceSocket } from '../api/ws-prices';
import { useAuth } from '../auth/AuthProvider';
import { formatCash, useTheme } from '../theme';
import { clearSession, hasSeenOnboarding, loadSession, markOnboardingDone, saveSession } from '../utils/storage';
import { parseHash, syncHash } from '../utils/routing';
import { hapticError, hapticSuccess } from '../utils/haptics';
import { notifyLocal } from '../native/push';
import { checkWatchlistAlerts } from '../utils/watchlistAlerts';
import { mergeMarketCatalog } from '../utils/marketFeed';

interface AppState {
  phase: Phase;
  tab: Tab;
  markets: Market[];
  activeCategory: string;
  searchQuery: string;
  selectedId: string | null;
  timeframe: string;
  ticket: TicketInfo | null;
  amount: string;
  toast: ToastMsg | null;
  cash: number;
  positions: Position[];
  orders: Order[];
  watchlist: string[];
  loadingMarkets: boolean;
  loadingPortfolio: boolean;
  ordering: boolean;
  settingUpTrading: boolean;
  settingsOpen: boolean;
  marketsError: string | null;
  portfolioError: string | null;
  openOrders: OpenOrder[];
  loadingOpenOrders: boolean;
  cashOutOpen: boolean;
  depositOpen: boolean;
}

const WATCHLIST_KEY = 'navo-watchlist';
const LEGACY_WATCHLIST_KEY = 'foresight-watchlist';

function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY) ?? localStorage.getItem(LEGACY_WATCHLIST_KEY);
    if (raw && !localStorage.getItem(WATCHLIST_KEY) && localStorage.getItem(LEGACY_WATCHLIST_KEY)) {
      localStorage.setItem(WATCHLIST_KEY, raw);
      localStorage.removeItem(LEGACY_WATCHLIST_KEY);
    }
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

const session = loadSession();
const initial: AppState = {
  phase: session?.phase === 'app' ? 'app' : hasSeenOnboarding() ? 'app' : 'landing',
  tab: (session?.tab as Tab) ?? 'markets',
  markets: [],
  activeCategory: 'Trending',
  searchQuery: '',
  selectedId: null,
  timeframe: '1D',
  ticket: null,
  amount: '',
  toast: null,
  cash: 0,
  positions: [],
  orders: [],
  watchlist: loadWatchlist(),
  loadingMarkets: true,
  loadingPortfolio: false,
  ordering: false,
  settingUpTrading: false,
  settingsOpen: false,
  marketsError: null,
  portfolioError: null,
  openOrders: [],
  loadingOpenOrders: false,
  cashOutOpen: false,
  depositOpen: false,
};

type Action =
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SET_MARKETS'; markets: Market[]; loading?: boolean; error?: string | null }
  | { type: 'MERGE_MARKETS'; markets: Market[] }
  | { type: 'PATCH_MARKET_PRICES'; updates: Array<{ id: string; yes: number }> }
  | { type: 'SET_CATEGORY'; category: string }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'OPEN_MARKET'; id: string }
  | { type: 'CLOSE_MARKET' }
  | { type: 'SET_TIMEFRAME'; tf: string }
  | { type: 'OPEN_TICKET'; ticket: TicketInfo }
  | { type: 'CLOSE_TICKET' }
  | { type: 'SET_AMOUNT'; amount: string }
  | { type: 'PRESS_KEY'; key: string }
  | { type: 'ORDER_PLACED'; position: Position; order: Order; cost: number; toast: ToastMsg }
  | { type: 'ORDER_SOLD'; order: Order; proceeds: number; positionId: string; sharesSold: number; toast: ToastMsg }
  | { type: 'SYNC_PORTFOLIO'; cash: number; positions: Position[]; orders: Order[]; loading?: boolean; error?: string | null }
  | { type: 'SET_ORDERING'; ordering: boolean }
  | { type: 'SET_SETTING_UP_TRADING'; settingUpTrading: boolean }
  | { type: 'TOGGLE_WATCH'; id: string }
  | { type: 'SHOW_TOAST'; toast: ToastMsg }
  | { type: 'HIDE_TOAST' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'CLEAR_WATCHLIST' }
  | { type: 'UPDATE_TICKET_PRICE'; price: number }
  | { type: 'SET_ORDER_KIND'; kind: 'market' | 'limit' }
  | { type: 'SET_OPEN_ORDERS'; openOrders: OpenOrder[]; loading?: boolean }
  | { type: 'REMOVE_OPEN_ORDER'; id: string }
  | { type: 'OPEN_CASH_OUT' }
  | { type: 'CLOSE_CASH_OUT' }
  | { type: 'OPEN_DEPOSIT' }
  | { type: 'CLOSE_DEPOSIT' };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'SET_PHASE': {
      saveSession(a.phase, s.tab);
      if (a.phase === 'app') markOnboardingDone();
      return { ...s, phase: a.phase };
    }
    case 'SET_TAB': {
      saveSession(s.phase, a.tab);
      return { ...s, tab: a.tab, selectedId: null };
    }
    case 'SET_MARKETS': return { ...s, markets: a.markets, loadingMarkets: a.loading ?? false, marketsError: a.error ?? null };
    case 'MERGE_MARKETS': {
      if (!a.markets.length) return s;
      const byId = new Map(s.markets.map((m) => [m.id, m]));
      for (const incoming of a.markets) {
        const prev = byId.get(incoming.id);
        if (prev) {
          byId.set(incoming.id, {
            ...prev,
            ...incoming,
            yes: incoming.yes ?? prev.yes,
            volume24h: incoming.volume24h ?? prev.volume24h,
            liquidity: incoming.liquidity ?? prev.liquidity,
          });
        } else {
          byId.set(incoming.id, incoming);
        }
      }
      return { ...s, markets: [...byId.values()] };
    }
    case 'PATCH_MARKET_PRICES': {
      const byId = new Map(a.updates.map((u) => [u.id, u.yes]));
      const markets = s.markets.map((m) => {
        const yes = byId.get(m.id);
        return yes != null && m.type === 'binary' ? { ...m, yes } : m;
      });
      const positions = s.positions.map((p) => {
        const market = markets.find((m) => m.id === p.marketId || m.conditionId === p.marketId);
        if (!market || market.type !== 'binary' || market.yes == null) return p;
        const yes = byId.has(market.id) ? byId.get(market.id)! : market.yes;
        const currentPrice = p.side === 'No' ? 100 - yes : yes;
        return currentPrice === p.currentPrice ? p : { ...p, currentPrice };
      });
      return { ...s, markets, positions };
    }
    case 'SET_CATEGORY': return { ...s, activeCategory: a.category };
    case 'SET_QUERY': return { ...s, searchQuery: a.query };
    case 'OPEN_MARKET': return { ...s, selectedId: a.id, timeframe: '1D' };
    case 'CLOSE_MARKET': return { ...s, selectedId: null };
    case 'SET_TIMEFRAME': return { ...s, timeframe: a.tf };
    case 'OPEN_TICKET': return { ...s, ticket: a.ticket, amount: '' };
    case 'UPDATE_TICKET_PRICE':
      return s.ticket ? { ...s, ticket: { ...s.ticket, price: a.price } } : s;
    case 'SET_ORDER_KIND':
      return s.ticket ? { ...s, ticket: { ...s.ticket, orderKind: a.kind } } : s;
    case 'CLOSE_TICKET': return { ...s, ticket: null, amount: '' };
    case 'SET_AMOUNT': return { ...s, amount: a.amount };
    case 'PRESS_KEY': {
      const k = a.key;
      if (k === '⌫') return { ...s, amount: s.amount.slice(0, -1) };
      if (k === '.') return s.amount.includes('.') ? s : { ...s, amount: (s.amount === '' ? '0' : s.amount) + '.' };
      if (s.amount.replace('.', '').length >= 6) return s;
      if (s.amount === '0') return { ...s, amount: k };
      return { ...s, amount: s.amount + k };
    }
    case 'ORDER_PLACED':
      return {
        ...s,
        cash: Math.max(0, s.cash - a.cost),
        positions: [a.position, ...s.positions],
        orders: [a.order, ...s.orders],
        ticket: null,
        amount: '',
        toast: a.toast,
      };
    case 'ORDER_SOLD': {
      const positions = s.positions
        .map((p) => {
          if (p.id !== a.positionId) return p;
          const remaining = p.shares - a.sharesSold;
          return remaining > 0 ? { ...p, shares: remaining } : null;
        })
        .filter((p): p is Position => p !== null);
      return {
        ...s,
        cash: s.cash + a.proceeds,
        positions,
        orders: [a.order, ...s.orders],
        ticket: null,
        amount: '',
        toast: a.toast,
      };
    }
    case 'SYNC_PORTFOLIO':
      return {
        ...s,
        cash: a.cash,
        positions: a.positions,
        orders: a.orders,
        loadingPortfolio: a.loading ?? false,
        portfolioError: a.error ?? null,
      };
    case 'SET_ORDERING': return { ...s, ordering: a.ordering };
    case 'SET_SETTING_UP_TRADING': return { ...s, settingUpTrading: a.settingUpTrading };
    case 'TOGGLE_WATCH': {
      const watchlist = s.watchlist.includes(a.id) ? s.watchlist.filter((x) => x !== a.id) : [...s.watchlist, a.id];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
      return { ...s, watchlist };
    }
    case 'SHOW_TOAST': return { ...s, toast: a.toast };
    case 'HIDE_TOAST': return { ...s, toast: null };
    case 'OPEN_SETTINGS': return { ...s, settingsOpen: true };
    case 'CLOSE_SETTINGS': return { ...s, settingsOpen: false };
    case 'CLEAR_WATCHLIST':
      localStorage.setItem(WATCHLIST_KEY, '[]');
      return { ...s, watchlist: [] };
    case 'SET_OPEN_ORDERS':
      return { ...s, openOrders: a.openOrders, loadingOpenOrders: a.loading ?? false };
    case 'REMOVE_OPEN_ORDER':
      return { ...s, openOrders: s.openOrders.filter((o) => o.id !== a.id) };
    case 'OPEN_CASH_OUT':
      return { ...s, cashOutOpen: true };
    case 'CLOSE_CASH_OUT':
      return { ...s, cashOutOpen: false };
    case 'OPEN_DEPOSIT':
      return { ...s, depositOpen: true };
    case 'CLOSE_DEPOSIT':
      return { ...s, depositOpen: false };
    default: return s;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  openTicket: (m: Market, kind: 'yes' | 'no' | 'outcome', outcomeIdx?: number, liveYes?: number) => void;
  openSellTicket: (p: Position) => void;
  confirmOrder: () => Promise<void>;
  setupTrading: () => Promise<void>;
  transferToSafe: () => Promise<void>;
  withdrawToEoa: (amountUsd?: number) => Promise<void>;
  refreshMarkets: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  refreshOpenOrders: () => Promise<void>;
  cancelOpenOrder: (orderId: string) => Promise<void>;
  cancelAllOpenOrders: () => Promise<void>;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<number>();
  const routeHydrated = useRef(false);
  const refreshOpenOrdersRef = useRef<() => Promise<void>>(async () => {});
  const { authenticated, ready, login, waitForWalletProfile } = useAuth();
  const { colors: C } = useTheme();

  const toast = (t: ToastMsg) => dispatch({ type: 'SHOW_TOAST', toast: t });

  const refreshMarkets = async () => {
    dispatch({ type: 'SET_MARKETS', markets: stateRef.current.markets, loading: true, error: null });
    try {
      const fresh = await api.getMarkets();
      const merged = mergeMarketCatalog(fresh, stateRef.current.markets);
      dispatch({ type: 'SET_MARKETS', markets: merged, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load markets';
      dispatch({ type: 'SET_MARKETS', markets: stateRef.current.markets, loading: false, error: msg });
      toast({ title: 'Could not refresh', msg: 'Check your connection and try again', variant: 'error' });
    }
  };

  const refreshPortfolio = async () => {
    if (!authenticated) return;
    dispatch({
      type: 'SYNC_PORTFOLIO',
      cash: stateRef.current.cash,
      positions: stateRef.current.positions,
      orders: stateRef.current.orders,
      loading: true,
      error: null,
    });
    try {
      const snap = await api.getPortfolio();
      const extra = await api.loadMissingMarkets(snap.positions.map((p) => p.marketId));
      if (extra.length) dispatch({ type: 'MERGE_MARKETS', markets: extra });
      dispatch({ type: 'SYNC_PORTFOLIO', ...snap, loading: false, error: null });
      void refreshOpenOrders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load portfolio';
      dispatch({
        type: 'SYNC_PORTFOLIO',
        cash: stateRef.current.cash,
        positions: stateRef.current.positions,
        orders: stateRef.current.orders,
        loading: false,
        error: msg,
      });
      toast({ title: 'Portfolio sync failed', msg: 'Could not load your positions', variant: 'error' });
    }
  };

  const syncMarketPrices = async () => {
    try {
      const updates = await api.syncLivePrices(stateRef.current.markets);
      if (updates.length) dispatch({ type: 'PATCH_MARKET_PRICES', updates });
    } catch {
      // Non-critical background sync.
    }
  };

  useEffect(() => {
    refreshMarkets();
    const applyRoute = (route: ReturnType<typeof parseHash>) => {
      if (route.phase === 'app') {
        dispatch({ type: 'SET_PHASE', phase: 'app' });
        if (route.tab) dispatch({ type: 'SET_TAB', tab: route.tab });
        if (route.marketId) {
          void api.loadMissingMarkets([route.marketId]).then((markets) => {
            if (markets.length) {
              dispatch({ type: 'MERGE_MARKETS', markets });
              dispatch({ type: 'OPEN_MARKET', id: markets[0]!.id });
            } else {
              dispatch({ type: 'OPEN_MARKET', id: route.marketId! });
            }
          });
        }
      } else if (route.phase === 'onboarding') {
        dispatch({ type: 'SET_PHASE', phase: 'onboarding' });
      } else if (route.phase === 'landing') {
        dispatch({ type: 'SET_PHASE', phase: 'landing' });
      }
    };

    applyRoute(parseHash());
    routeHydrated.current = true;

    const onHashChange = () => applyRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!routeHydrated.current) return;
    syncHash({ phase: state.phase, tab: state.tab, selectedId: state.selectedId });
  }, [state.phase, state.tab, state.selectedId]);

  useEffect(() => {
    if (ready && authenticated) {
      dispatch({ type: 'SET_PHASE', phase: 'app' });
      if (stateRef.current.phase === 'app') refreshPortfolio();
    }
  }, [ready, authenticated]);

  useEffect(() => {
    if (state.phase !== 'app' || !authenticated) return;
    const id = window.setInterval(() => {
      if (stateRef.current.tab === 'portfolio' || stateRef.current.selectedId) void refreshPortfolio();
      // HTTP backup — primary prices come from WebSocket
      if (stateRef.current.tab === 'markets' && !stateRef.current.loadingMarkets) void syncMarketPrices();
      if (stateRef.current.tab === 'portfolio') void refreshOpenOrdersRef.current();
    }, 60000);
    return () => window.clearInterval(id);
  }, [state.phase, authenticated]);

  // Live Polymarket WebSocket prices
  useEffect(() => {
    if (state.phase !== 'app') {
      marketPriceSocket.disconnect();
      return;
    }
    marketPriceSocket.setMarkets(state.markets);
    const unsub = marketPriceSocket.subscribe((updates) => {
      dispatch({ type: 'PATCH_MARKET_PRICES', updates });
      const questions: Record<string, string> = {};
      for (const m of stateRef.current.markets) questions[m.id] = m.question;
      checkWatchlistAlerts(updates, stateRef.current.watchlist, questions);
    });
    return () => {
      unsub();
    };
  }, [state.phase, state.markets]);

  useEffect(() => {
    if (state.phase !== 'app') return;
    return () => marketPriceSocket.disconnect();
  }, [state.phase]);

  useEffect(() => {
    if (state.toast) {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3200);
    }
    return () => window.clearTimeout(toastTimer.current);
  }, [state.toast]);

  const refreshOpenOrders = async () => {
    if (!authenticated) {
      dispatch({ type: 'SET_OPEN_ORDERS', openOrders: [], loading: false });
      return;
    }
    dispatch({ type: 'SET_OPEN_ORDERS', openOrders: stateRef.current.openOrders, loading: true });
    try {
      const openOrders = await api.getOpenOrders();
      dispatch({ type: 'SET_OPEN_ORDERS', openOrders, loading: false });
    } catch {
      dispatch({ type: 'SET_OPEN_ORDERS', openOrders: stateRef.current.openOrders, loading: false });
    }
  };
  refreshOpenOrdersRef.current = refreshOpenOrders;

  const cancelOpenOrder = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      dispatch({ type: 'REMOVE_OPEN_ORDER', id: orderId });
      toast({ title: 'Order cancelled', msg: 'Limit order removed from the book', variant: 'success' });
      notifyLocal('Order cancelled', 'Your limit order was removed');
      hapticSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cancel failed';
      toast({ title: 'Cancel failed', msg, variant: 'error' });
      hapticError();
      throw err;
    }
  };

  const cancelAllOpenOrders = async () => {
    try {
      await api.cancelAllOrders();
      dispatch({ type: 'SET_OPEN_ORDERS', openOrders: [], loading: false });
      toast({ title: 'All orders cancelled', msg: 'Open limit orders cleared', variant: 'success' });
      notifyLocal('Orders cancelled', 'All open limit orders were cancelled');
      hapticSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cancel failed';
      toast({ title: 'Cancel failed', msg, variant: 'error' });
      hapticError();
      throw err;
    }
  };

  const setupTrading = async () => {
    if (!authenticated) {
      const profile = await login();
      if (!profile) {
        toast({ title: 'Sign in required', msg: 'Connect your wallet to enable trading', variant: 'info' });
        return;
      }
    } else if (!ready) {
      const profile = await waitForWalletProfile();
      if (!profile) {
        toast({
          title: 'Wallet not ready',
          msg: 'Your wallet is still loading. Wait a few seconds and try again.',
          variant: 'error',
        });
        return;
      }
    }

    const builderReady = await api.isBuilderConfigured();
    if (!builderReady) {
      toast({
        title: 'Trading not available',
        msg: import.meta.env.DEV
          ? 'Add POLYMARKET_BUILDER_* to .env.local and restart npm run dev'
          : 'Trading server is offline. Check VITE_POLYMARKET_SIGN_URL / health endpoint.',
        variant: 'error',
      });
      return;
    }
    dispatch({ type: 'SET_SETTING_UP_TRADING', settingUpTrading: true });
    const steps: Record<string, string> = {
      relay: 'Connecting to Polymarket…',
      deploy: 'Deploying trading wallet…',
      credentials: 'Setting up API access…',
      approvals: 'Approving tokens…',
      done: 'Ready to trade',
    };
    try {
      await api.setupTrading((step) => {
        toast({ title: 'Trading setup', msg: steps[step] ?? step, variant: 'info' });
      });
      toast({ title: 'Trading enabled', msg: 'Your Polymarket trading wallet is ready', variant: 'success' });
      hapticSuccess();
      await refreshPortfolio();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Setup failed';
      toast({ title: 'Setup failed', msg, variant: 'error' });
      hapticError();
      throw err;
    } finally {
      dispatch({ type: 'SET_SETTING_UP_TRADING', settingUpTrading: false });
    }
  };

  const transferToSafe = async () => {
    if (!authenticated) {
      const profile = await login();
      if (!profile) return;
    } else if (!ready) {
      const profile = await waitForWalletProfile();
      if (!profile) {
        toast({ title: 'Wallet not ready', msg: 'Wait a moment and try again.', variant: 'error' });
        return;
      }
    }
    try {
      const amount = await api.transferDepositToSafe();
      if (amount > 0) {
        toast({ title: 'Funds moved', msg: `${formatCash(amount)} sent to your trading wallet`, variant: 'success' });
        hapticSuccess();
        await refreshPortfolio();
      } else {
        toast({ title: 'Nothing to move', msg: 'No USDC found in your deposit wallet', variant: 'info' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      toast({ title: 'Transfer failed', msg, variant: 'error' });
      hapticError();
    }
  };

  const withdrawToEoa = async (amountUsd?: number) => {
    if (!authenticated) {
      const profile = await login();
      if (!profile) return;
    } else if (!ready) {
      const profile = await waitForWalletProfile();
      if (!profile) {
        toast({ title: 'Wallet not ready', msg: 'Wait a moment and try again.', variant: 'error' });
        return;
      }
    }
    try {
      const amount = await api.withdrawToEoa(amountUsd);
      if (amount > 0) {
        toast({ title: 'Withdrawal sent', msg: `${formatCash(amount)} moved to your deposit wallet`, variant: 'success' });
        hapticSuccess();
        await refreshPortfolio();
      } else {
        toast({ title: 'Nothing to withdraw', msg: 'No USDC in your trading wallet', variant: 'info' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed';
      toast({ title: 'Withdrawal failed', msg, variant: 'error' });
      hapticError();
    }
  };

  const openTicket: AppContextValue['openTicket'] = (m, kind, outcomeIdx = 0, liveYes) => {
    if (!authenticated) {
      toast({ title: 'Sign in required', msg: 'Connect your wallet to place orders', variant: 'info' });
      return;
    }

    const yes = liveYes ?? m.yes ?? 50;
    let price: number;
    let sideLabel: string;
    let color: string;

    if (kind === 'yes') {
      price = yes;
      sideLabel = 'Yes';
      color = C.green;
    } else if (kind === 'no') {
      price = 100 - yes;
      sideLabel = 'No';
      color = C.red;
    } else {
      const o = m.outcomes![outcomeIdx];
      price = o.price;
      sideLabel = o.name;
      color = o.color;
    }

    const tokenId = resolveTokenId(m, sideLabel);
    if (!tokenId) {
      toast({ title: 'Unavailable', msg: 'This market cannot be traded yet', variant: 'error' });
      return;
    }

    dispatch({
      type: 'OPEN_TICKET',
      ticket: {
        marketId: m.id,
        question: m.question,
        initials: m.initials,
        marketColor: m.color,
        sideLabel,
        price,
        color,
        tokenId,
        mode: 'buy',
        tickSize: m.tickSize,
        negRisk: m.negRisk,
        openPrice: price,
        orderKind: 'market',
      },
    });
  };

  const openSellTicket: AppContextValue['openSellTicket'] = (p) => {
    if (!authenticated) {
      toast({ title: 'Sign in required', msg: 'Connect your wallet to sell', variant: 'info' });
      return;
    }
    if (!p.tokenId) {
      toast({ title: 'Unavailable', msg: 'Cannot sell this position yet', variant: 'error' });
      return;
    }
    dispatch({
      type: 'OPEN_TICKET',
      ticket: {
        marketId: p.marketId,
        question: p.question,
        initials: p.initials,
        marketColor: p.marketColor,
        sideLabel: p.side,
        price: p.currentPrice,
        color: p.sideColor,
        tokenId: p.tokenId,
        mode: 'sell',
        maxShares: p.shares,
        positionId: p.id,
        tickSize: p.tickSize,
        negRisk: p.negRisk,
        openPrice: p.currentPrice,
        orderKind: 'market',
      },
    });
  };

  const confirmOrder = async () => {
    const s = stateRef.current;
    const amt = parseFloat(s.amount) || 0;
    const tk = s.ticket;
    if (amt <= 0 || !tk) { dispatch({ type: 'CLOSE_TICKET' }); return; }

    if (!authenticated) await login();

    const isSell = tk.mode === 'sell';
    const shareCount = isSell ? amt : Math.round(amt / (tk.price / 100));

    if (isSell && tk.maxShares && shareCount > tk.maxShares) {
      toast({ title: 'Too many shares', msg: `You only hold ${tk.maxShares} shares`, variant: 'error' });
      return;
    }

    if (!isSell && amt > s.cash) {
      toast({ title: 'Insufficient balance', msg: 'Deposit USDC to your trading wallet', variant: 'error' });
      return;
    }

    if (!isSell && amt < 5) {
      toast({ title: 'Amount too small', msg: 'Minimum order is about $5 (5 shares)', variant: 'error' });
      return;
    }

    const market = s.markets.find((m) => m.id === tk.marketId);
    dispatch({ type: 'SET_ORDERING', ordering: true });
    try {
      const builderReady = await api.isBuilderConfigured();
      if (!builderReady) {
        toast({ title: 'Trading unavailable', msg: 'Builder credentials or sign server not configured', variant: 'error' });
        return;
      }

      const res = await api.placeOrder({
        marketId: tk.marketId,
        side: tk.sideLabel,
        price: tk.price,
        amountUsd: isSell ? 0 : amt,
        shares: shareCount,
        tokenId: tk.tokenId,
        tickSize: tk.tickSize ?? market?.tickSize,
        negRisk: tk.negRisk ?? market?.negRisk,
        mode: tk.mode,
        orderKind: tk.orderKind ?? 'market',
      });

      const kindLabel = (tk.orderKind ?? 'market') === 'limit' ? 'Limit order placed' : isSell ? 'Sold' : 'Order placed';

      if (isSell) {
        const proceeds = (shareCount * tk.price) / 100;
        dispatch({
          type: 'ORDER_SOLD',
          proceeds,
          positionId: tk.positionId ?? tk.marketId,
          sharesSold: shareCount,
          order: {
            id: res.orderId,
            time: 'Today',
            question: tk.question,
            side: tk.sideLabel,
            shares: shareCount,
            amount: proceeds,
            action: 'sell',
          },
          toast: { title: kindLabel, msg: `Sold ${shareCount} ${tk.sideLabel} shares`, variant: 'success' },
        });
        hapticSuccess();
      } else {
        dispatch({
          type: 'ORDER_PLACED',
          cost: amt,
          position: {
            id: res.orderId,
            marketId: tk.marketId,
            question: tk.question,
            side: tk.sideLabel,
            sideColor: tk.color,
            shares: res.shares,
            avgPrice: res.avgPrice,
            currentPrice: res.avgPrice,
            initials: tk.initials,
            marketColor: tk.marketColor,
            tokenId: tk.tokenId,
            tickSize: tk.tickSize ?? market?.tickSize,
            negRisk: tk.negRisk ?? market?.negRisk,
          },
          order: {
            id: res.orderId,
            time: 'Today',
            question: tk.question,
            side: tk.sideLabel,
            shares: res.shares,
            amount: amt,
            action: 'buy',
          },
          toast: {
            title: kindLabel,
            msg: (tk.orderKind ?? 'market') === 'limit'
              ? `Limit buy ${res.shares} ${tk.sideLabel} @ ${tk.price}¢`
              : `Bought ${res.shares} ${tk.sideLabel} shares`,
            variant: 'success',
          },
        });
        hapticSuccess();
      }

      await refreshPortfolio();
      if ((tk.orderKind ?? 'market') === 'limit') void refreshOpenOrders();
      notifyLocal(
        (tk.orderKind ?? 'market') === 'limit' ? 'Limit order placed' : isSell ? 'Sold' : 'Order filled',
        `${tk.sideLabel} · ${tk.question.slice(0, 60)}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Order failed', msg, variant: 'error' });
      hapticError();
    } finally {
      dispatch({ type: 'SET_ORDERING', ordering: false });
    }
  };

  return <Ctx.Provider value={{ state, dispatch, openTicket, openSellTicket, confirmOrder, setupTrading, transferToSafe, withdrawToEoa, refreshMarkets, refreshPortfolio, refreshOpenOrders, cancelOpenOrder, cancelAllOpenOrders }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
