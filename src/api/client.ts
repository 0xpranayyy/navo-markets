import { OrderType, Side } from '@polymarket/clob-client-v2';
import type { ActivityItem, Market, OpenOrder, OrderBook, PortfolioSnapshot } from '../types';
import { getAuthBridge } from './auth-bridge';
import { isBuilderConfigured } from './builder-status';
import {
  fetchGammaMarkets,
  fetchMarketsByConditionIds,
  fetchMarketActivity,
  fetchMidpointPrice,
  fetchMidpointsForMarkets,
  fetchOrderBook,
  fetchPortfolio,
  fetchPriceHistory,
  searchMarkets as searchGammaMarkets,
} from './polymarket';
import {
  checkTradingAllowed,
  resolveOrderOptions,
  toTickSize,
  validateOrderSize,
} from './trading/order-preflight';
import {
  getActiveSafeAddress,
  getTradingClient,
  syncCollateralBalance,
  type SetupStep,
} from './trading/session';
import { fundTradingWallet, getUsdcBalance, withdrawFromTradingWallet } from './trading/transfer';

export interface PlaceOrderRequest {
  marketId: string;
  side: string;
  price: number; // cents
  amountUsd: number;
  shares: number;
  tokenId: string;
  tickSize?: string;
  negRisk?: boolean;
  mode: 'buy' | 'sell';
  orderKind?: 'market' | 'limit';
}

export interface PlaceOrderResult {
  orderId: string;
  shares: number;
  avgPrice: number;
}

export interface ApiClient {
  signIn(): Promise<{ userId: string } | null>;
  getMarkets(): Promise<Market[]>;
  getOrderBook(marketId: string, market?: Market): Promise<OrderBook>;
  getPriceHistory(tokenId: string, timeframe: string): Promise<number[]>;
  getActivity(market: Market): Promise<ActivityItem[]>;
  searchMarkets(query: string): Promise<Market[]>;
  setupTrading(onStep?: (step: SetupStep) => void): Promise<string>;
  placeOrder(req: PlaceOrderRequest): Promise<PlaceOrderResult>;
  getPortfolio(): Promise<PortfolioSnapshot>;
  getEoaUsdcBalance(): Promise<number>;
  transferDepositToSafe(): Promise<number>;
  withdrawToEoa(amountUsd?: number): Promise<number>;
  getOpenOrders(): Promise<OpenOrder[]>;
  cancelOrder(orderId: string): Promise<void>;
  cancelAllOrders(): Promise<void>;
  getLivePrice(tokenId: string): Promise<number | null>;
  syncLivePrices(markets?: Market[]): Promise<Array<{ id: string; yes: number }>>;
  loadMissingMarkets(conditionIds: string[]): Promise<Market[]>;
  isBuilderConfigured(): Promise<boolean>;
}

class PolymarketApiClient implements ApiClient {
  private marketCache: Market[] = [];

  private findMarket(marketId: string, market?: Market): Market | undefined {
    return market ?? this.marketCache.find((x) => x.id === marketId || x.conditionId === marketId);
  }

  private async wallet() {
    const bridge = getAuthBridge();
    if (!bridge?.isAuthenticated()) throw new Error('Sign in to trade');

    if (!bridge.isReady()) {
      throw new Error('Wallet is still loading. Wait a moment and try again.');
    }

    const user = bridge.getUser() ?? await bridge.waitForWallet();
    if (!user?.address) {
      throw new Error('No wallet available. Sign out and sign in again, or wait a few seconds.');
    }

    const walletClient = await bridge.getWalletClient();
    if (!walletClient) throw new Error('Could not connect wallet');
    return { walletClient, eoaAddress: user.address };
  }

  async signIn() {
    const bridge = getAuthBridge();
    if (!bridge) throw new Error('Auth not initialized');
    const user = await bridge.login();
    return user ? { userId: user.id } : null;
  }

  async getMarkets(): Promise<Market[]> {
    this.marketCache = await fetchGammaMarkets();
    const updates = await fetchMidpointsForMarkets(this.marketCache);
    for (const { id, yes } of updates) {
      const market = this.marketCache.find((m) => m.id === id);
      if (market?.type === 'binary') market.yes = yes;
    }
    return [...this.marketCache];
  }

  async syncLivePrices(markets?: Market[]): Promise<Array<{ id: string; yes: number }>> {
    const list = markets ?? this.marketCache;
    const updates = await fetchMidpointsForMarkets(list);
    for (const { id, yes } of updates) {
      const market = this.marketCache.find((m) => m.id === id);
      if (market?.type === 'binary') market.yes = yes;
    }
    return updates;
  }

  async loadMissingMarkets(conditionIds: string[]): Promise<Market[]> {
    const missing = conditionIds.filter(
      (id) => !this.marketCache.some((m) => m.id === id || m.conditionId === id),
    );
    if (!missing.length) return [];
    const markets = await fetchMarketsByConditionIds(missing);
    for (const market of markets) {
      if (!this.marketCache.some((m) => m.id === market.id)) {
        this.marketCache.push(market);
      }
    }
    return markets;
  }

  async isBuilderConfigured(): Promise<boolean> {
    return isBuilderConfigured();
  }

  async getOrderBook(_marketId: string, market?: Market): Promise<OrderBook> {
    const m = this.findMarket(_marketId, market);
    if (!m?.tokenIds?.[0]) throw new Error('Market has no token IDs');
    return fetchOrderBook(m.tokenIds[0], m.tokenIds[1]);
  }

  async getPriceHistory(tokenId: string, timeframe: string): Promise<number[]> {
    return fetchPriceHistory(tokenId, timeframe);
  }

  async getActivity(market: Market): Promise<ActivityItem[]> {
    if (!market.slug) return [];
    return fetchMarketActivity(market.slug);
  }

  async searchMarkets(query: string): Promise<Market[]> {
    return searchGammaMarkets(query);
  }

  async setupTrading(onStep?: (step: SetupStep) => void): Promise<string> {
    const { walletClient, eoaAddress } = await this.wallet();
    const { safeAddress } = await getTradingClient(eoaAddress, walletClient, onStep);
    return safeAddress;
  }

  async placeOrder(req: PlaceOrderRequest): Promise<PlaceOrderResult> {
    const { walletClient, eoaAddress } = await this.wallet();
    const { client } = await getTradingClient(eoaAddress, walletClient);
    const market = this.findMarket(req.marketId);
    await checkTradingAllowed(req.mode, client);

    const orderOptions = await resolveOrderOptions(
      client,
      req.tokenId,
      req.tickSize,
      req.negRisk,
      market?.conditionId,
    );
    const price = req.price / 100;
    const options = { tickSize: toTickSize(orderOptions.tickSize), negRisk: orderOptions.negRisk };
    const useLimit = req.orderKind === 'limit';

    const size = req.mode === 'sell'
      ? req.shares
      : Math.max(1, Math.ceil((useLimit ? req.amountUsd : req.amountUsd) / price));
    validateOrderSize(req.mode, size, orderOptions.minOrderSize);

    let response;
    if (useLimit) {
      response = await client.createAndPostOrder(
        { tokenID: req.tokenId, price, side: req.mode === 'sell' ? Side.SELL : Side.BUY, size },
        options,
        OrderType.GTC,
      );
    } else {
      response = req.mode === 'sell'
        ? await client.createAndPostMarketOrder(
            { tokenID: req.tokenId, amount: req.shares, side: Side.SELL, price },
            options,
            OrderType.FOK,
          )
        : await client.createAndPostMarketOrder(
            { tokenID: req.tokenId, amount: req.amountUsd, side: Side.BUY, price },
            options,
            OrderType.FOK,
          );
    }

    if (!response.success) {
      throw new Error(response.errorMsg ?? 'Order failed');
    }

    const shares = req.mode === 'sell' ? req.shares : Math.round(req.amountUsd / price);
    return {
      orderId: response.orderID ?? 'ord_' + Date.now(),
      shares,
      avgPrice: req.price,
    };
  }

  async getPortfolio(): Promise<PortfolioSnapshot> {
    const bridge = getAuthBridge();
    const user = bridge?.getUser();
    if (!user?.address) {
      return { cash: 0, positions: [], orders: [] };
    }

    const safeAddress = getActiveSafeAddress() ?? loadSafeFromStorage(user.address);
    const portfolioAddress = safeAddress ?? user.address;
    const snapshot = await fetchPortfolio(portfolioAddress);

    await this.loadMissingMarkets(snapshot.positions.map((p) => p.marketId));

    snapshot.positions = snapshot.positions.map((p) => {
      const market = this.marketCache.find(
        (m) => m.id === p.marketId || m.conditionId === p.marketId,
      );
      if (!market) return p;
      return {
        ...p,
        marketId: market.id,
        tickSize: market.tickSize,
        negRisk: market.negRisk,
        marketColor: market.color,
        initials: market.initials,
      };
    });

    try {
      const { walletClient, eoaAddress } = await this.wallet();
      const { client } = await getTradingClient(eoaAddress, walletClient);
      snapshot.cash = await syncCollateralBalance(client);
    } catch {
      // Trading session not ready — positions still load from Data API.
    }

    return snapshot;
  }

  async getEoaUsdcBalance(): Promise<number> {
    const bridge = getAuthBridge();
    const user = bridge?.getUser();
    if (!user?.address) return 0;
    return getUsdcBalance(user.address);
  }

  async transferDepositToSafe(): Promise<number> {
    const { walletClient, eoaAddress } = await this.wallet();
    const safeAddress = getActiveSafeAddress() ?? loadSafeFromStorage(eoaAddress);
    if (!safeAddress) throw new Error('Enable trading first to get your Safe wallet');
    const result = await fundTradingWallet(walletClient, eoaAddress, safeAddress);
    return result?.amount ?? 0;
  }

  async withdrawToEoa(amountUsd?: number): Promise<number> {
    const { walletClient, eoaAddress } = await this.wallet();
    const safeAddress = getActiveSafeAddress() ?? loadSafeFromStorage(eoaAddress);
    if (!safeAddress) throw new Error('Enable trading first to get your Safe wallet');
    const result = await withdrawFromTradingWallet(walletClient, safeAddress, eoaAddress, amountUsd);
    return result?.amount ?? 0;
  }

  async getOpenOrders(): Promise<OpenOrder[]> {
    const { walletClient, eoaAddress } = await this.wallet();
    const { client } = await getTradingClient(eoaAddress, walletClient);
    const raw = await client.getOpenOrders();
    const list = Array.isArray(raw) ? raw : [];

    const missingIds = list
      .map((o) => o.market)
      .filter((id) => !this.marketCache.some((m) => m.conditionId === id || m.id === id));
    if (missingIds.length) {
      const loaded = await this.loadMissingMarkets(missingIds);
      if (loaded.length) {
        // loadMissingMarkets already merges into cache via caller; ensure local cache
        for (const m of loaded) {
          if (!this.marketCache.some((x) => x.id === m.id)) this.marketCache.push(m);
        }
      }
    }

    return list.map((o) => {
      const original = Number(o.original_size) || 0;
      const matched = Number(o.size_matched) || 0;
      const price = Math.round(Number(o.price) * 100);
      const market = this.marketCache.find(
        (m) => m.conditionId === o.market || m.id === o.market || m.tokenIds?.includes(o.asset_id),
      );
      const question = market?.question
        ?? (o.outcome ? `${o.outcome} market` : 'Open order');
      return {
        id: o.id,
        marketId: market?.id ?? o.market,
        question,
        side: o.side,
        outcome: o.outcome || (o.side === 'BUY' ? 'Yes' : 'No'),
        price,
        originalSize: original,
        sizeMatched: matched,
        remaining: Math.max(0, original - matched),
        orderType: o.order_type || 'GTC',
        createdAt: o.created_at,
        assetId: o.asset_id,
      };
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    const { walletClient, eoaAddress } = await this.wallet();
    const { client } = await getTradingClient(eoaAddress, walletClient);
    await client.cancelOrder({ orderID: orderId });
  }

  async cancelAllOrders(): Promise<void> {
    const { walletClient, eoaAddress } = await this.wallet();
    const { client } = await getTradingClient(eoaAddress, walletClient);
    await client.cancelAll();
  }

  async getLivePrice(tokenId: string): Promise<number | null> {
    return fetchMidpointPrice(tokenId);
  }
}

function loadSafeFromStorage(eoa: string): string | null {
  try {
    const raw = localStorage.getItem('navo-trading-' + eoa.toLowerCase())
      ?? localStorage.getItem('foresight-trading-' + eoa.toLowerCase());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      safeAddress?: string;
      depositWalletAddress?: string;
      version?: number;
    };
    if (parsed.version !== 3) return null;
    return parsed.safeAddress ?? parsed.depositWalletAddress ?? null;
  } catch {
    return null;
  }
}

export { isBuilderConfigured } from './builder-status';
export const api: ApiClient = new PolymarketApiClient();
