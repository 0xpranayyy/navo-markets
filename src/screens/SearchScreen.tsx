import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../api/client';
import { useTheme } from '../theme';
import { CATEGORIES } from '../constants/categories';
import MarketCard from '../components/MarketCard';
import ErrorState from '../components/ErrorState';
import type { Market } from '../types';
import { LargeTitle, SearchField, SectionHeader } from '../components/ios/controls';
import { iosLayout } from '../theme/typography';
import { hapticLight } from '../utils/haptics';
import { isTradableMarket, topMarkets } from '../utils/marketFeed';

export default function SearchScreen() {
  const { state, dispatch } = useApp();
  const { colors: C, card } = useTheme();
  const q = state.searchQuery.trim();
  const [results, setResults] = useState<Market[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trending = topMarkets(state.markets, 4);

  const runSearch = (query: string) => {
    setSearching(true);
    setSearchError(null);
    void api.searchMarkets(query).then((markets) => {
      const active = markets.filter(isTradableMarket);
      setResults(active);
      if (active.length) dispatch({ type: 'MERGE_MARKETS', markets: active });
      setSearching(false);
    }).catch((err) => {
      setResults([]);
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setSearching(false);
    });
  };

  useEffect(() => {
    if (!q) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const timer = window.setTimeout(() => runSearch(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const display = q ? results : [];

  return (
    <div className="anim-fadeslide" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <LargeTitle>Search</LargeTitle>

      <SearchField
        value={state.searchQuery}
        onChange={(query) => dispatch({ type: 'SET_QUERY', query })}
        placeholder="Search markets"
        onClear={() => dispatch({ type: 'SET_QUERY', query: '' })}
        inputRef={inputRef}
      />

      <div className="no-scrollbar ios-scroll" style={{
        flex: 1, overflowY: 'auto', padding: `0 ${iosLayout.screenMargin}px 120px`,
        WebkitOverflowScrolling: 'touch',
      }}>
        {q === '' ? (
          <>
            <SectionHeader>Categories</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {CATEGORIES.filter((c) => c !== 'Trending').map((c) => (
                <div
                  key={c}
                  className="pressable"
                  onClick={() => {
                    hapticLight();
                    dispatch({ type: 'SET_CATEGORY', category: c });
                    dispatch({ type: 'SET_TAB', tab: 'markets' });
                  }}
                  style={{
                    ...card, borderRadius: 14, padding: '16px 14px',
                    fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: -0.3,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
            <SectionHeader>Trending</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trending.map((m) => <MarketCard key={m.id} market={m} />)}
            </div>
          </>
        ) : searching ? (
          <div style={{ textAlign: 'center', color: C.faint, fontSize: 15, padding: '60px 0' }}>Searching…</div>
        ) : searchError ? (
          <ErrorState title="Search failed" message={searchError} onRetry={() => runSearch(q)} />
        ) : display.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {display.map((m) => <MarketCard key={m.id} market={m} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: C.faint, fontSize: 15, padding: '60px 0' }}>No markets found</div>
        )}
      </div>
    </div>
  );
}
