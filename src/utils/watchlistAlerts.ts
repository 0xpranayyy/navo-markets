import { isPushEnabled, notifyLocal } from '../native/push';

const ALERTS_KEY = 'navo-watchlist-alerts';
const LAST_KEY = 'navo-watchlist-alert-prices';
/** Alert when probability moves by this many points since last alert. */
const THRESHOLD = 5;
/** Min ms between alerts for the same market. */
const COOLDOWN_MS = 5 * 60 * 1000;

export function isWatchlistAlertsEnabled(): boolean {
  return localStorage.getItem(ALERTS_KEY) !== '0';
}

export function setWatchlistAlertsEnabled(enabled: boolean) {
  localStorage.setItem(ALERTS_KEY, enabled ? '1' : '0');
}

type LastMap = Record<string, { price: number; at: number }>;

function loadLast(): LastMap {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) ?? '{}') as LastMap;
  } catch {
    return {};
  }
}

function saveLast(map: LastMap) {
  localStorage.setItem(LAST_KEY, JSON.stringify(map));
}

/**
 * Fire local notifications when watchlisted markets move ≥ THRESHOLD points.
 * Seeds baseline on first sight without notifying.
 */
export function checkWatchlistAlerts(
  updates: Array<{ id: string; yes: number }>,
  watchlist: string[],
  questions: Record<string, string>,
) {
  if (!isWatchlistAlertsEnabled() || !isPushEnabled() || !watchlist.length) return;

  const watched = new Set(watchlist);
  const last = loadLast();
  const now = Date.now();
  let changed = false;

  for (const u of updates) {
    if (!watched.has(u.id)) continue;
    const prev = last[u.id];
    if (!prev) {
      last[u.id] = { price: u.yes, at: now };
      changed = true;
      continue;
    }
    const delta = Math.abs(u.yes - prev.price);
    if (delta < THRESHOLD) continue;
    if (now - prev.at < COOLDOWN_MS) continue;

    const dir = u.yes > prev.price ? 'up' : 'down';
    const q = questions[u.id] ?? 'Watchlist market';
    notifyLocal(
      `Watchlist ${dir} ${delta}pt`,
      `${q.slice(0, 72)} → ${u.yes}%`,
    );
    last[u.id] = { price: u.yes, at: now };
    changed = true;
  }

  if (changed) saveLast(last);
}
