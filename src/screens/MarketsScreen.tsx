import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useTheme } from '../theme';
import { CATEGORIES } from '../constants/categories';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import MarketCard from '../components/MarketCard';
import PullRefreshIndicator from '../components/PullRefreshIndicator';
import ErrorState from '../components/ErrorState';
import { MarketCardSkeleton } from '../components/Skeleton';
import { marketPriceSocket } from '../api/ws-prices';
import { LargeTitle, SearchField } from '../components/ios/controls';
import { iosLayout } from '../theme/typography';
import { hapticLight } from '../utils/haptics';
import { buildMarketFeed, categoryFeedCounts } from '../utils/marketFeed';

export default function MarketsScreen() {
  const { state, dispatch, refreshMarkets } = useApp();
  const { colors: C, resolved } = useTheme();
  const { pull, refreshing, handlers } = usePullToRefresh(refreshMarkets);
  const [live, setLive] = useState(marketPriceSocket.isConnected());
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => marketPriceSocket.onStatus(setLive), []);

  const feed = buildMarketFeed(state.markets, state.activeCategory);
  const counts = useMemo(() => categoryFeedCounts(state.markets), [state.markets]);
  const emptyHint = state.activeCategory === 'Trending'
    ? 'Pull to refresh — markets update throughout the day.'
    : `No active ${state.activeCategory.toLowerCase()} markets right now. Try Trending or Search.`;

  return (
    <div className="anim-fadeslide" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Sticky frosted header — collapses into compact bar feel when scrolled */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
        background: scrolled
          ? (resolved === 'dark' ? 'rgba(0,0,0,0.72)' : 'rgba(242,242,247,0.78)')
          : 'transparent',
        backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : undefined,
        WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(180%)' : undefined,
        borderBottom: scrolled ? `0.33px solid ${C.divider}` : 'none',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}>
        <LargeTitle compact={scrolled}
          trailing={
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4,
              fontSize: 12, fontWeight: 600, letterSpacing: -0.08,
              color: live ? C.green : C.faint,
            }}>
              <span className={live ? 'anim-live-dot' : undefined} style={{
                width: 6, height: 6, borderRadius: 9999,
                background: live ? C.green : C.faint,
                display: 'inline-block',
              }} />
              {live ? 'Live' : 'Syncing'}
            </div>
          }
        >
          Markets
        </LargeTitle>

        <SearchField
          readOnly
          placeholder="Search"
          onClick={() => { hapticLight(); dispatch({ type: 'SET_TAB', tab: 'search' }); }}
        />

        <div className="no-scrollbar" style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          padding: `0 ${iosLayout.screenMargin}px 10px`, WebkitOverflowScrolling: 'touch',
        }}>
          {CATEGORIES.map((c) => {
            const activeCat = c === state.activeCategory;
            const count = counts[c] ?? 0;
            return (
              <div
                key={c}
                className="pressable pressable-sm"
                onClick={() => { hapticLight(); dispatch({ type: 'SET_CATEGORY', category: c }); }}
                style={{
                  padding: '7px 14px', borderRadius: 9999,
                  background: activeCat ? C.categoryChipActiveBg : C.categoryChipBg,
                  color: activeCat ? C.categoryChipActiveText : C.categoryChipText,
                  fontSize: 15, fontWeight: activeCat ? 600 : 400,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  letterSpacing: -0.24,
                  minHeight: 32,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {c}
                {count > 0 && (
                  <span style={{
                    fontSize: 12, fontWeight: 600, opacity: activeCat ? 0.85 : 0.55,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <PullRefreshIndicator pull={pull} refreshing={refreshing} loading={state.loadingMarkets && !state.markets.length} />
      <div
        className="no-scrollbar ios-scroll"
        {...handlers}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
        style={{
          flex: 1, overflowY: 'auto',
          padding: `4px ${iosLayout.screenMargin}px 20px`,
          display: 'flex', flexDirection: 'column', gap: 12,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {state.marketsError && !feed.length && (
          <ErrorState title="Couldn't load markets" message={state.marketsError} onRetry={() => void refreshMarkets()} />
        )}
        {state.loadingMarkets && !feed.length && !state.marketsError && (
          <>
            <MarketCardSkeleton />
            <MarketCardSkeleton />
            <MarketCardSkeleton />
          </>
        )}
        {!feed.length && !state.loadingMarkets && !state.marketsError && (
          <div style={{ textAlign: 'center', color: C.faint, padding: '48px 24px', fontSize: 15, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, color: C.sub, marginBottom: 8 }}>No markets here</div>
            {emptyHint}
          </div>
        )}
        {feed.map((m) => <MarketCard key={m.id} market={m} />)}
      </div>
    </div>
  );
}
