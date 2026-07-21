import type { Category, Market } from '../types';
import { CATEGORIES } from '../constants/categories';

/** Minimum 24h volume (USD) for Trending tab. */
const MIN_TRENDING_VOLUME24H = 500;

/** Minimum activity to show in category tabs (avoids illiquid / untradeable clutter). */
const MIN_CATEGORY_VOLUME24H = 100;
const MIN_CATEGORY_LIQUIDITY = 750;

/** Probability at or above this — market is treated as resolved. */
const RESOLVED_HIGH = 0.98;

export function marketEndMs(m: Market): number | null {
  const iso = m.endDateIso;
  if (!iso) return null;
  const normalized = iso.includes('T') ? iso : `${iso}T23:59:59Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

export function isMarketExpired(m: Market, now = Date.now()): boolean {
  const endMs = marketEndMs(m);
  return endMs != null && endMs < now;
}

export function isEffectivelyResolved(m: Market): boolean {
  if (m.type === 'binary' && m.yes != null) {
    return m.yes / 100 >= RESOLVED_HIGH;
  }
  if (m.outcomes?.length) {
    const max = Math.max(...m.outcomes.map((o) => o.price / 100));
    return max >= RESOLVED_HIGH;
  }
  return false;
}

export function isTradableMarket(m: Market): boolean {
  if (m.active === false) return false;
  if (m.closed) return false;
  if (m.acceptingOrders === false) return false;
  if (m.enableOrderBook === false) return false;
  if (isMarketExpired(m)) return false;
  if (isEffectivelyResolved(m)) return false;
  return true;
}

/** Markets worth surfacing in category tabs — enough volume or liquidity to trade. */
export function isFeasibleMarket(m: Market): boolean {
  if (!isTradableMarket(m)) return false;
  const vol24 = activityVolume(m);
  const liq = m.liquidity ?? 0;
  return vol24 >= MIN_CATEGORY_VOLUME24H || liq >= MIN_CATEGORY_LIQUIDITY;
}

/** Deduplicate by conditionId — keep the market with highest 24h volume. */
export function dedupeMarkets(markets: Market[]): Market[] {
  const byKey = new Map<string, Market>();
  for (const m of markets) {
    const key = m.conditionId ?? m.id;
    const prev = byKey.get(key);
    if (!prev || activityVolume(m) > activityVolume(prev)) {
      byKey.set(key, m);
    }
  }
  return [...byKey.values()];
}

export function activityVolume(m: Market): number {
  return m.volume24h ?? m.volume ?? 0;
}

/** Trending score — favors recent activity, liquidity, and price movement. */
export function trendingScore(m: Market): number {
  const vol24 = activityVolume(m);
  const liq = m.liquidity ?? 0;
  const move = Math.abs(m.change ?? 0);

  const volScore = Math.log10(Math.max(vol24, 1) + 1) * 2.2;
  const liqScore = Math.log10(Math.max(liq, 1) + 1) * 0.9;
  const moveScore = Math.min(move / 12, 1) * 1.4;

  return volScore + liqScore + moveScore;
}

/** Stable per-day tie-breaker so similar-score markets rotate without jumping every render. */
function daySeed(): number {
  const d = new Date();
  return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
}

function stableShuffleKey(id: string, bucket: number): number {
  let h = daySeed() ^ (bucket * 9973);
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Sort for Trending — score tiers + stable daily variety. */
export function sortTrendingFeed(markets: Market[]): Market[] {
  const scored = markets.map((m) => ({
    m,
    score: trendingScore(m),
    bucket: Math.floor(trendingScore(m) * 4),
  }));

  scored.sort((a, b) => {
    if (b.bucket !== a.bucket) return b.bucket - a.bucket;
    if (Math.abs(b.score - a.score) > 0.05) return b.score - a.score;
    return stableShuffleKey(a.m.id, a.bucket) - stableShuffleKey(b.m.id, b.bucket);
  });

  return scored.map((s) => s.m);
}

/** Sort category tabs by what people actually trade — 24h volume, then liquidity. */
export function sortCategoryFeed(markets: Market[]): Market[] {
  return [...markets].sort((a, b) => {
    const volDiff = activityVolume(b) - activityVolume(a);
    if (Math.abs(volDiff) > 50) return volDiff;
    const liqDiff = (b.liquidity ?? 0) - (a.liquidity ?? 0);
    if (Math.abs(liqDiff) > 100) return liqDiff;
    return Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0);
  });
}

/** @deprecated Use sortTrendingFeed or sortCategoryFeed. */
export function sortMarketFeed(markets: Market[]): Market[] {
  return sortTrendingFeed(markets);
}

/** Active tradable markets only — used before merging into catalog state. */
export function filterActiveMarkets(markets: Market[]): Market[] {
  return markets.filter(isTradableMarket);
}

/** Count feasible markets per tab (for chip labels). */
export function categoryFeedCounts(markets: Market[]): Record<string, number> {
  const active = dedupeMarkets(markets).filter(isTradableMarket);
  const counts: Record<string, number> = { Trending: 0 };

  const trendingPool = active.filter((m) => activityVolume(m) >= MIN_TRENDING_VOLUME24H);
  counts.Trending = (trendingPool.length >= 8 ? trendingPool : active).length;

  for (const cat of CATEGORIES) {
    if (cat === 'Trending') continue;
    counts[cat] = active.filter((m) => m.category === cat && isFeasibleMarket(m)).length;
  }

  return counts;
}

/** Build the main markets feed for a tab. */
export function buildMarketFeed(markets: Market[], category: string): Market[] {
  const active = filterActiveMarkets(dedupeMarkets(markets));

  if (category === 'Trending') {
    const trending = active.filter((m) => activityVolume(m) >= MIN_TRENDING_VOLUME24H);
    const pool = trending.length >= 8 ? trending : active.filter(isFeasibleMarket);
    return sortTrendingFeed(pool.length ? pool : active);
  }

  const inCategory = active.filter((m) => m.category === category);
  const feasible = inCategory.filter(isFeasibleMarket);
  // Show feasible markets first; if tab would be empty, relax to all tradable in category.
  return sortCategoryFeed(feasible.length >= 3 ? feasible : inCategory);
}

/** Top N for search/onboarding teasers. */
export function topMarkets(markets: Market[], limit = 4): Market[] {
  return buildMarketFeed(markets, 'Trending').slice(0, limit);
}

export function mergeMarketCatalog(fresh: Market[], existing: Market[]): Market[] {
  const freshIds = new Set(fresh.map((m) => m.id));
  const preserved = existing.filter((m) => {
    if (freshIds.has(m.id)) return false;
    if (!isTradableMarket(m)) return false;
    // Drop stale zero-activity markets so the catalog doesn't grow forever.
    const vol24 = activityVolume(m);
    const liq = m.liquidity ?? 0;
    return vol24 >= 50 || liq >= 500;
  });
  return dedupeMarkets([...fresh, ...preserved]);
}

export type { Category };
