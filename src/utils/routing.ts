import type { Phase, Tab } from '../types';

export interface RouteState {
  phase?: Phase;
  tab?: Tab;
  marketId?: string;
}

export function parseHash(hashOverride?: string): RouteState {
  const hash = (hashOverride ?? window.location.hash).replace(/^#/, '');
  const parts = hash.split('/').filter(Boolean);
  if (!parts.length) return {};

  if (parts[0] === 'landing') return { phase: 'landing' };
  if (parts[0] === 'onboarding') return { phase: 'onboarding' };

  if (parts[0] === 'app') {
    if (parts[1] === 'market' && parts[2]) {
      return { phase: 'app', marketId: decodeURIComponent(parts[2]) };
    }
    const tab = parts[1] as Tab | undefined;
    if (tab === 'markets' || tab === 'search' || tab === 'portfolio' || tab === 'profile') {
      return { phase: 'app', tab };
    }
    return { phase: 'app', tab: 'markets' };
  }

  return {};
}

export function buildHash(state: { phase: Phase; tab: Tab; selectedId: string | null }): string {
  if (state.phase === 'landing') return '#/landing';
  if (state.phase === 'onboarding') return '#/onboarding';
  if (state.selectedId) return `#/app/market/${encodeURIComponent(state.selectedId)}`;
  return `#/app/${state.tab}`;
}

export function syncHash(state: { phase: Phase; tab: Tab; selectedId: string | null }) {
  const next = buildHash(state);
  if (window.location.hash !== next) {
    window.history.replaceState(null, '', next);
  }
}
