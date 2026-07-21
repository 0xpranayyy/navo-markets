import type { Market } from '../types';

const WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';
const PING_MS = 10_000;
const RECONNECT_MS = 3_000;

export type PriceUpdate = { id: string; yes: number };

type Listener = (updates: PriceUpdate[]) => void;

function midCents(bestBid?: string, bestAsk?: string, last?: string): number | null {
  const bid = bestBid != null ? Number(bestBid) : NaN;
  const ask = bestAsk != null ? Number(bestAsk) : NaN;
  if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) {
    return Math.round(((bid + ask) / 2) * 100);
  }
  if (Number.isFinite(bid) && bid > 0) return Math.round(bid * 100);
  if (Number.isFinite(ask) && ask > 0) return Math.round(ask * 100);
  const p = last != null ? Number(last) : NaN;
  if (Number.isFinite(p) && p > 0) return Math.round(p * 100);
  return null;
}

/** Polymarket CLOB market-channel WebSocket for live Yes prices. */
export class MarketPriceSocket {
  private ws: WebSocket | null = null;
  private pingId: number | null = null;
  private reconnectId: number | null = null;
  private intentionalClose = false;
  private assetToMarket = new Map<string, string>();
  private subscribedKey = '';
  private listeners = new Set<Listener>();
  private statusListeners = new Set<(connected: boolean) => void>();
  private connected = false;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: (connected: boolean) => void) {
    this.statusListeners.add(listener);
    listener(this.connected);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  isConnected() {
    return this.connected;
  }

  private setConnected(value: boolean) {
    if (this.connected === value) return;
    this.connected = value;
    for (const l of this.statusListeners) l(value);
  }

  private emit(updates: PriceUpdate[]) {
    if (!updates.length) return;
    for (const l of this.listeners) l(updates);
  }

  /** Sync subscription to current market list (Yes token = tokenIds[0]). */
  setMarkets(markets: Market[]) {
    const next = new Map<string, string>();
    for (const m of markets) {
      if (m.type !== 'binary' || !m.tokenIds?.[0]) continue;
      next.set(m.tokenIds[0], m.id);
    }
    const key = [...next.keys()].sort().join(',');
    this.assetToMarket = next;
    if (key === this.subscribedKey && this.ws?.readyState === WebSocket.OPEN) return;
    this.subscribedKey = key;
    this.connect();
  }

  private connect() {
    this.intentionalClose = false;
    this.clearTimers();
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
    const assets = [...this.assetToMarket.keys()];
    if (!assets.length) return;

    const ws = new WebSocket(WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      this.setConnected(true);
      ws.send(JSON.stringify({
        type: 'market',
        assets_ids: assets,
        custom_feature_enabled: true,
      }));
      this.pingId = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('PING');
      }, PING_MS);
    };

    ws.onmessage = (ev) => {
      if (typeof ev.data !== 'string') return;
      if (ev.data === 'PONG' || ev.data === 'pong') return;
      try {
        const msg = JSON.parse(ev.data) as Record<string, unknown>;
        this.handleMessage(msg);
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      this.setConnected(false);
      this.clearTimers();
      this.ws = null;
      if (!this.intentionalClose && this.assetToMarket.size) {
        this.reconnectId = window.setTimeout(() => this.connect(), RECONNECT_MS);
      }
    };

    ws.onerror = () => {
      try { ws.close(); } catch { /* ignore */ }
    };
  }

  private handleMessage(msg: Record<string, unknown>) {
    const eventType = String(msg.event_type ?? '');
    const updates: PriceUpdate[] = [];

    if (eventType === 'best_bid_ask') {
      const assetId = String(msg.asset_id ?? '');
      const marketId = this.assetToMarket.get(assetId);
      if (!marketId) return;
      const yes = midCents(String(msg.best_bid ?? ''), String(msg.best_ask ?? ''));
      if (yes != null) updates.push({ id: marketId, yes });
    } else if (eventType === 'last_trade_price') {
      const assetId = String(msg.asset_id ?? '');
      const marketId = this.assetToMarket.get(assetId);
      if (!marketId) return;
      const yes = midCents(undefined, undefined, String(msg.price ?? ''));
      if (yes != null) updates.push({ id: marketId, yes });
    } else if (eventType === 'price_change' && Array.isArray(msg.price_changes)) {
      for (const pc of msg.price_changes as Array<Record<string, string>>) {
        const marketId = this.assetToMarket.get(String(pc.asset_id ?? ''));
        if (!marketId) continue;
        const yes = midCents(pc.best_bid, pc.best_ask, pc.price);
        if (yes != null) updates.push({ id: marketId, yes });
      }
    } else if (eventType === 'book') {
      const assetId = String(msg.asset_id ?? '');
      const marketId = this.assetToMarket.get(assetId);
      if (!marketId) return;
      const bids = msg.bids as Array<{ price: string }> | undefined;
      const asks = msg.asks as Array<{ price: string }> | undefined;
      const bestBid = bids?.[bids.length - 1]?.price ?? bids?.[0]?.price;
      const bestAsk = asks?.[0]?.price;
      const yes = midCents(bestBid, bestAsk);
      if (yes != null) updates.push({ id: marketId, yes });
    }

    this.emit(updates);
  }

  private clearTimers() {
    if (this.pingId != null) window.clearInterval(this.pingId);
    if (this.reconnectId != null) window.clearTimeout(this.reconnectId);
    this.pingId = null;
    this.reconnectId = null;
  }

  disconnect() {
    this.intentionalClose = true;
    this.clearTimers();
    this.subscribedKey = '';
    this.setConnected(false);
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
  }
}

export const marketPriceSocket = new MarketPriceSocket();
