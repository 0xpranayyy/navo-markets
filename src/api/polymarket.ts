import type { ActivityItem, Category, Market, Order, OrderBook, Outcome, Position } from '../types';
import { CATEGORY_GAMMA_TAGS } from '../constants/categories';

const GAMMA = import.meta.env.VITE_POLYMARKET_GAMMA_API ?? 'https://gamma-api.polymarket.com';
const CLOB = import.meta.env.VITE_POLYMARKET_CLOB_API ?? 'https://clob.polymarket.com';
const DATA = import.meta.env.VITE_POLYMARKET_DATA_API ?? 'https://data-api.polymarket.com';

const OUTCOME_COLORS = ['#0A84FF', '#BF5AF2', '#FF9F0A', '#30D158', '#FF453A', '#64D2FF', '#FF375F', '#8E8E93'];
const MARKET_COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF453A', '#64D2FF', '#FF375F', '#F7931A'];

const CATEGORY_MAP: Record<string, Category> = {
  politics: 'Politics',
  election: 'Politics',
  elections: 'Politics',
  government: 'Politics',
  'international-affairs': 'Politics',
  'foreign-affairs': 'Politics',
  'house-races': 'Politics',
  'federal-government': 'Politics',
  sports: 'Sports',
  nfl: 'Sports',
  nba: 'Sports',
  mlb: 'Sports',
  nhl: 'Sports',
  soccer: 'Sports',
  ufc: 'Sports',
  f1: 'Sports',
  'world-cup': 'Sports',
  crypto: 'Crypto',
  bitcoin: 'Crypto',
  ethereum: 'Crypto',
  defi: 'Crypto',
  blockchain: 'Crypto',
  openai: 'Crypto',
  finance: 'Economy',
  business: 'Economy',
  economy: 'Economy',
  fed: 'Economy',
  stocks: 'Economy',
  macro: 'Economy',
  pop: 'Pop Culture',
  culture: 'Pop Culture',
  entertainment: 'Pop Culture',
  music: 'Pop Culture',
  movies: 'Pop Culture',
  celebrity: 'Pop Culture',
  tech: 'Pop Culture',
  ai: 'Pop Culture',
  science: 'Economy',
  awards: 'Pop Culture',
};

export const TIMEFRAME_PARAMS: Record<string, { interval: string; fidelity: number }> = {
  '1H': { interval: '1h', fidelity: 1 },
  '6H': { interval: '6h', fidelity: 5 },
  '1D': { interval: '1d', fidelity: 15 },
  '1W': { interval: '1w', fidelity: 60 },
  ALL: { interval: 'max', fidelity: 360 },
};

interface GammaMarket {
  id: string;
  question: string;
  conditionId?: string;
  slug?: string;
  image?: string;
  icon?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume?: number;
  volumeNum?: number;
  volume24hr?: number;
  volume24hrClob?: number;
  liquidity?: string;
  liquidityNum?: number;
  endDate?: string;
  endDateIso?: string;
  oneDayPriceChange?: number;
  oneWeekPriceChange?: number;
  clobTokenIds?: string;
  orderPriceMinTickSize?: number;
  negRisk?: boolean;
  closed?: boolean;
  active?: boolean;
  archived?: boolean;
  acceptingOrders?: boolean;
  enableOrderBook?: boolean;
  events?: Array<{ tags?: Array<{ label?: string; slug?: string }> }>;
}

interface GammaEvent {
  id: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  tags?: Array<{ label?: string; slug?: string }>;
  markets?: GammaMarket[];
}

interface ClobBook {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

interface DataPosition {
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  curPrice: number;
  title: string;
  outcome: string;
  icon?: string;
}

interface DataTrade {
  side: 'BUY' | 'SELL';
  asset: string;
  timestamp: number;
  title: string;
  outcome: string;
  size: number;
  price: number;
  transactionHash?: string;
}

function parseJsonArray<T>(raw: string | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function colorFromSeed(seed: string, palette: string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initialsFromQuestion(question: string): string {
  const words = question.replace(/[^a-zA-Z0-9\s₿Ξ]/g, '').split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return question.slice(0, 2).toUpperCase();
}

function inferCategory(raw: GammaMarket): Category {
  const tags = raw.events?.flatMap((e) => e.tags ?? []).flatMap((t) => [
    t.label?.toLowerCase() ?? '',
    t.slug?.toLowerCase() ?? '',
  ]) ?? [];

  for (const tag of tags) {
    if (!tag) continue;
    if (CATEGORY_MAP[tag]) return CATEGORY_MAP[tag];
    for (const [key, category] of Object.entries(CATEGORY_MAP)) {
      if (tag.includes(key)) return category;
    }
  }

  const q = raw.question.toLowerCase();
  if (/\b(bitcoin|btc|eth|ethereum|crypto|token|solana|defi|blockchain|nft|dogecoin|xrp)\b/.test(q)) return 'Crypto';
  if (/\b(nfl|nba|mlb|nhl|super bowl|championship|world cup|match|ufc|f1|formula|tennis|golf|premier league)\b/.test(q)) return 'Sports';
  if (/\b(fed|fomc|gdp|recession|inflation|interest rate|economy|ipo|stock|tariff|unemployment|cpi|jobs report)\b/.test(q)) return 'Economy';
  if (/\b(oscar|album|movie|taylor|celebrity|grammy|gta|spotify|tiktok|youtube|netflix|award)\b/.test(q)) return 'Pop Culture';
  if (/\b(president|senate|election|trump|biden|congress|vote|party|prime minister|governor|democrat|republican)\b/.test(q)) return 'Politics';
  return 'Economy';
}

/** Normalize binary markets so tokenIds are always [Yes, No] regardless of Gamma order. */
function normalizeBinaryMarket(
  outcomes: string[],
  prices: string[],
  tokenIds: string[],
): { yesPrice: number; tokenIds: [string, string] | string[] } {
  const lower = outcomes.map((o) => o.toLowerCase());
  const yesIdx = lower.indexOf('yes');
  const noIdx = lower.indexOf('no');

  if (yesIdx >= 0 && noIdx >= 0 && tokenIds[yesIdx] && tokenIds[noIdx]) {
    return {
      yesPrice: Math.round(parseFloat(prices[yesIdx] ?? '0.5') * 100),
      tokenIds: [tokenIds[yesIdx], tokenIds[noIdx]],
    };
  }

  return {
    yesPrice: Math.round(parseFloat(prices[0] ?? '0.5') * 100),
    tokenIds,
  };
}

function isPastEndDate(raw: GammaMarket): boolean {
  const iso = raw.endDate ?? raw.endDateIso;
  if (!iso) return false;
  const normalized = iso.includes('T') ? iso : `${iso}T23:59:59Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) && ms < Date.now();
}

function isResolvedOutcomePrices(outcomes: string[], prices: string[]): boolean {
  const lower = outcomes.map((o) => o.toLowerCase());
  const yesIdx = lower.indexOf('yes');
  if (yesIdx >= 0 && prices[yesIdx] != null) {
    const yes = parseFloat(prices[yesIdx]);
    if (Number.isFinite(yes) && yes >= 0.98) return true;
    return false;
  }
  const nums = prices.map((p) => parseFloat(p)).filter((n) => Number.isFinite(n));
  if (!nums.length) return false;
  return Math.max(...nums) >= 0.98;
}

function isActiveGammaMarket(raw: GammaMarket): boolean {
  if (raw.closed || raw.archived) return false;
  if (raw.active === false) return false;
  if (raw.acceptingOrders === false) return false;
  if (raw.enableOrderBook === false) return false;
  if (isPastEndDate(raw)) return false;
  const outcomes = parseJsonArray<string>(raw.outcomes, []);
  const prices = parseJsonArray<string>(raw.outcomePrices, []);
  if (isResolvedOutcomePrices(outcomes, prices)) return false;
  return true;
}

function formatEndDate(raw: GammaMarket): string {
  const iso = raw.endDateIso ?? raw.endDate?.slice(0, 10);
  if (!iso) return 'TBD';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapBookSide(levels: Array<{ price: string; size: string }>, limit = 5) {
  return [...levels]
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    .slice(0, limit)
    .map((l) => ({
      price: Math.round(parseFloat(l.price) * 100),
      size: Math.round(parseFloat(l.size)),
    }));
}

function formatRelativeTime(ts: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function mapGammaMarket(raw: GammaMarket): Market | null {
  if (!isActiveGammaMarket(raw)) return null;

  const outcomes = parseJsonArray<string>(raw.outcomes, []);
  const prices = parseJsonArray<string>(raw.outcomePrices, []);
  const tokenIds = parseJsonArray<string>(raw.clobTokenIds, []);
  if (!outcomes.length || !tokenIds.length) return null;

  const change = Math.round(((raw.oneDayPriceChange ?? raw.oneWeekPriceChange ?? 0) as number) * 1000) / 10;
  const type = outcomes.length > 2 ? 'multi' : 'binary';
  const volume24h = raw.volume24hrClob ?? raw.volume24hr ?? 0;
  const liquidity = raw.liquidityNum ?? (raw.liquidity ? parseFloat(raw.liquidity) : 0);

  const base: Market = {
    id: raw.id,
    category: inferCategory(raw),
    type,
    question: raw.question,
    initials: initialsFromQuestion(raw.question),
    color: colorFromSeed(raw.id, MARKET_COLORS),
    volume: raw.volumeNum ?? raw.volume ?? 0,
    volume24h,
    liquidity,
    active: raw.active ?? true,
    closed: raw.closed ?? false,
    acceptingOrders: raw.acceptingOrders ?? true,
    enableOrderBook: raw.enableOrderBook ?? true,
    endDateIso: raw.endDateIso ?? raw.endDate?.slice(0, 10),
    end: formatEndDate(raw),
    change,
    trend: [],
    tokenIds,
    conditionId: raw.conditionId,
    tickSize: String(raw.orderPriceMinTickSize ?? 0.01),
    negRisk: raw.negRisk ?? false,
    slug: raw.slug,
    image: raw.image ?? raw.icon,
  };

  if (type === 'binary') {
    const normalized = normalizeBinaryMarket(outcomes, prices, tokenIds);
    return { ...base, yes: normalized.yesPrice, tokenIds: normalized.tokenIds };
  }

  const mappedOutcomes: Outcome[] = outcomes.map((name, i) => ({
    name,
    price: Math.round(parseFloat(prices[i] ?? '0') * 100),
    color: OUTCOME_COLORS[i % OUTCOME_COLORS.length],
    tokenId: tokenIds[i],
  }));

  const leadIdx = mappedOutcomes.reduce(
    (best, o, i) => (o.price > mappedOutcomes[best].price ? i : best),
    0,
  );

  return { ...base, yes: mappedOutcomes[leadIdx]?.price ?? 0, outcomes: mappedOutcomes };
}

const GAMMA_PAGE_SIZE = 50;
const GAMMA_CATALOG_LIMIT = 320;
const GAMMA_EVENT_TARGET = 120;
const TAG_SUPPLEMENT_PER_TAG = 30;

async function fetchGammaEventsPage(offset: number, limit: number, tagSlug?: string): Promise<GammaEvent[]> {
  const params = new URLSearchParams({
    active: 'true',
    closed: 'false',
    archived: 'false',
    limit: String(limit),
    offset: String(offset),
    order: 'volume24hr',
    ascending: 'false',
  });
  if (tagSlug) params.set('tag_slug', tagSlug);
  const res = await fetch(`${GAMMA}/events?${params}`);
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return (await res.json()) as GammaEvent[];
}

async function fetchGammaPage(offset: number, limit: number): Promise<GammaMarket[]> {
  const params = new URLSearchParams({
    closed: 'false',
    archived: 'false',
    limit: String(limit),
    offset: String(offset),
    order: 'volume24hr',
    ascending: 'false',
  });
  const res = await fetch(`${GAMMA}/markets?${params}`);
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return (await res.json()) as GammaMarket[];
}

function collectMarketsFromEvents(events: GammaEvent[], limit: number): Market[] {
  const seen = new Set<string>();
  const markets: Market[] = [];

  for (const event of events) {
    if (event.closed || event.archived || event.active === false) continue;
    for (const raw of event.markets ?? []) {
      if (seen.has(raw.id)) continue;
      const withTags = raw.events?.length
        ? raw
        : { ...raw, events: [{ tags: event.tags }] };
      const mapped = mapGammaMarket(withTags);
      if (mapped) {
        seen.add(raw.id);
        markets.push(mapped);
        if (markets.length >= limit) return markets;
      }
    }
  }

  return markets;
}

function mergeMarketsIntoCatalog(catalog: Market[], incoming: Market[], limit: number): Market[] {
  const seen = new Set(catalog.map((m) => m.id));
  for (const m of incoming) {
    if (seen.has(m.id)) continue;
    catalog.push(m);
    seen.add(m.id);
    if (catalog.length >= limit) break;
  }
  return catalog;
}

async function fetchCategoryTagSupplements(limit: number): Promise<GammaEvent[]> {
  const tagSlugs = [...new Set(Object.values(CATEGORY_GAMMA_TAGS).flat())];
  const batches = await Promise.all(
    tagSlugs.map((tag) =>
      fetchGammaEventsPage(0, TAG_SUPPLEMENT_PER_TAG, tag).catch(() => [] as GammaEvent[]),
    ),
  );
  const events: GammaEvent[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    for (const event of batch) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      events.push(event);
      if (events.length >= limit) return events;
    }
  }
  return events;
}

export async function fetchGammaMarkets(limit = GAMMA_CATALOG_LIMIT): Promise<Market[]> {
  const events: GammaEvent[] = [];
  let offset = 0;

  while (events.length < GAMMA_EVENT_TARGET) {
    const batch = await fetchGammaEventsPage(offset, GAMMA_PAGE_SIZE);
    if (!batch.length) break;
    events.push(...batch);
    offset += batch.length;
    if (batch.length < GAMMA_PAGE_SIZE) break;
  }

  // Backfill category tabs that volume-sorted feed under-represents.
  const tagEvents = await fetchCategoryTagSupplements(80);
  const seenEventIds = new Set(events.map((e) => e.id));
  for (const event of tagEvents) {
    if (!seenEventIds.has(event.id)) {
      events.push(event);
      seenEventIds.add(event.id);
    }
  }

  let markets = collectMarketsFromEvents(events, limit);

  if (markets.length < Math.min(limit, 40)) {
    const pages: GammaMarket[] = [];
    offset = 0;
    while (pages.length < limit) {
      const batch = await fetchGammaPage(offset, Math.min(GAMMA_PAGE_SIZE, limit - pages.length));
      if (!batch.length) break;
      pages.push(...batch);
      if (batch.length < GAMMA_PAGE_SIZE) break;
      offset += batch.length;
    }

    const supplemental = pages
      .map(mapGammaMarket)
      .filter((m): m is Market => m !== null);
    markets = mergeMarketsIntoCatalog(markets, supplemental, limit);
  }

  return markets;
}

export async function fetchMarketsByConditionIds(conditionIds: string[]): Promise<Market[]> {
  const unique = [...new Set(conditionIds.filter(Boolean))];
  if (!unique.length) return [];
  const res = await fetch(
    `${GAMMA}/markets?condition_ids=${unique.map(encodeURIComponent).join(',')}&limit=${unique.length}&closed=false`,
  );
  if (!res.ok) return [];
  const raw = (await res.json()) as GammaMarket[];
  return raw.map(mapGammaMarket).filter((m): m is Market => m !== null);
}

const MIDPOINT_BATCH = 12;

export async function fetchMidpointsForMarkets(markets: Market[]): Promise<Array<{ id: string; yes: number }>> {
  const binary = markets.filter((m) => m.type === 'binary' && m.tokenIds?.[0]);
  const results: Array<{ id: string; yes: number } | null> = [];

  for (let i = 0; i < binary.length; i += MIDPOINT_BATCH) {
    const batch = binary.slice(i, i + MIDPOINT_BATCH);
    const batchResults = await Promise.all(
      batch.map(async (m) => {
        const yes = await fetchMidpointPrice(m.tokenIds![0]);
        return yes !== null ? { id: m.id, yes } : null;
      }),
    );
    results.push(...batchResults);
  }

  return results.filter((r): r is { id: string; yes: number } => r !== null);
}

export async function fetchOrderBook(yesTokenId: string, noTokenId?: string): Promise<OrderBook> {
  const yesRes = await fetch(`${CLOB}/book?token_id=${yesTokenId}`);
  if (!yesRes.ok) throw new Error(`CLOB book error: ${yesRes.status}`);
  const yesBook = (await yesRes.json()) as ClobBook;

  let noLevels = yesBook.bids.map((b) => ({
    price: String(Math.max(0.01, 1 - parseFloat(b.price))),
    size: b.size,
  }));

  if (noTokenId) {
    const noRes = await fetch(`${CLOB}/book?token_id=${noTokenId}`);
    if (noRes.ok) {
      const noBook = (await noRes.json()) as ClobBook;
      noLevels = noBook.bids;
    }
  }

  return {
    yes: mapBookSide(yesBook.bids),
    no: mapBookSide(noLevels),
  };
}

/** Live YES midpoint in cents (1–99). */
export async function fetchMidpointPrice(yesTokenId: string): Promise<number | null> {
  try {
    const res = await fetch(`${CLOB}/midpoint?token_id=${yesTokenId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { mid?: string };
    if (!data.mid) return null;
    return Math.round(parseFloat(data.mid) * 100);
  } catch {
    return null;
  }
}

export async function fetchPriceHistory(tokenId: string, timeframe: string): Promise<number[]> {
  const params = TIMEFRAME_PARAMS[timeframe] ?? TIMEFRAME_PARAMS['1D'];
  const url = `${CLOB}/prices-history?market=${tokenId}&interval=${params.interval}&fidelity=${params.fidelity}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { history?: Array<{ p: number }> };
  const history = data.history ?? [];
  if (!history.length) return [];
  return history.map((h) => Math.round(h.p * 100));
}

export async function searchMarkets(query: string): Promise<Market[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await fetch(`${GAMMA}/public-search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { events?: GammaEvent[] };
  const seen = new Set<string>();
  const markets: Market[] = [];
  for (const event of data.events ?? []) {
    if (event.closed || event.archived) continue;
    for (const raw of event.markets ?? []) {
      if (raw.closed || raw.archived || seen.has(raw.id)) continue;
      const withTags = raw.events?.length
        ? raw
        : { ...raw, events: [{ tags: event.tags }] };
      const mapped = mapGammaMarket(withTags);
      if (mapped) {
        seen.add(raw.id);
        markets.push(mapped);
      }
    }
  }
  return markets;
}

interface DataTradeActivity {
  side: string;
  outcome: string;
  size: number;
  price: number;
  timestamp: number;
  pseudonym?: string;
  name?: string;
}

export async function fetchMarketActivity(slug: string): Promise<ActivityItem[]> {
  const res = await fetch(`${DATA}/trades?slug=${encodeURIComponent(slug)}&limit=15`);
  if (!res.ok) return [];
  const trades = (await res.json()) as DataTradeActivity[];
  return trades.map((t) => {
    const label = t.pseudonym || (t.name ? t.name.split('-')[0] : '') || 'Trader';
    return {
      name: label,
      initials: label.slice(0, 2).toUpperCase(),
      color: colorFromSeed(`${t.timestamp}-${t.outcome}`, MARKET_COLORS),
      text: `${t.side === 'BUY' ? 'Bought' : 'Sold'} ${Math.round(t.size * 10) / 10} ${t.outcome} @ ${Math.round(t.price * 100)}¢`,
      time: formatRelativeTime(t.timestamp),
      badge: t.side,
    };
  });
}

export function resolveTokenId(market: Market, sideLabel: string): string | null {
  if (!market.tokenIds?.length) return null;
  if (market.type === 'binary') {
    const label = sideLabel.toLowerCase();
    if (label === 'yes') return market.tokenIds[0] ?? null;
    if (label === 'no') return market.tokenIds[1] ?? null;
    return market.tokenIds[0] ?? null;
  }
  const outcome = market.outcomes?.find((o) => o.name === sideLabel);
  return outcome?.tokenId ?? null;
}

export async function fetchPortfolio(address: string): Promise<{ cash: number; positions: Position[]; orders: Order[] }> {
  const [posRes, tradesRes] = await Promise.all([
    fetch(`${DATA}/positions?user=${address}&sizeThreshold=0.01&limit=100`),
    fetch(`${DATA}/trades?user=${address}&limit=50`),
  ]);

  const positions: Position[] = [];
  if (posRes.ok) {
    const raw = (await posRes.json()) as DataPosition[];
    positions.push(
      ...raw.map((p) => ({
        id: p.asset,
        marketId: p.conditionId,
        question: p.title,
        side: p.outcome,
        sideColor: p.outcome === 'Yes' ? '#17C783' : p.outcome === 'No' ? '#FF4D67' : '#0A84FF',
        shares: Math.round(p.size * 100) / 100,
        avgPrice: Math.round(p.avgPrice * 100),
        currentPrice: Math.round(p.curPrice * 100),
        initials: initialsFromQuestion(p.title),
        marketColor: colorFromSeed(p.conditionId, MARKET_COLORS),
        tokenId: p.asset,
      })),
    );
  }

  const orders: Order[] = [];
  if (tradesRes.ok) {
    const raw = (await tradesRes.json()) as DataTrade[];
    orders.push(
      ...raw.map((t) => ({
        id: t.transactionHash ?? `${t.timestamp}-${t.asset}`,
        time: new Date(t.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        question: t.title,
        side: t.outcome,
        shares: Math.round(t.size * 100) / 100,
        amount: Math.round(t.size * t.price * 100) / 100,
        action: t.side === 'SELL' ? 'sell' as const : 'buy' as const,
      })),
    );
  }

  return { cash: 0, positions, orders };
}

export { CLOB, GAMMA, DATA };
