import { useEffect, useState } from 'react';
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
import { buildMarketFeed } from '../utils/marketFeed';

export default function MarketsScreen() {
  const { state, dispatch, refreshMarkets } = useApp();
  const { colors: C, resolved } = useTheme();
  const { pull, refreshing, handlers } = usePullToRefresh(refreshMarkets);
  const [live, setLive] = useState(marketPriceSocket.isConnected());
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => marketPriceSocket.onStatus(setLive), []);

  const feed = buildMarketFeed(state.markets, state.activeCategory);

  return (
    <div className="anim-fadeslide" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Sticky frosted header — collapses into compact bar feel when scrolled */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
        background: scrolled
          ? (resolved === 'dark' ? 'rgba(0,0,0,0.72)' : 'rgba(244,245,247,0.78)')
          : 'transparent',
        backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : undefined,
        WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(180%)' : undefined,
        borderBottom: scrolled ? `0.33px solid ${C.divider}` : 'none',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}>
        <LargeTitle compact={scrolled}
          trailing={
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
              ...{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4 },
              color: live ? C.green : C.faint,
            }}>
              <span className={live ? 'anim-live-dot' : undefined} style={{
                width: 6, height: 6, borderRadius: 9999,
                background: live ? C.green : C.faint,
                boxShadow: live ? `0 0 8px ${C.green}` : 'none',
                display: 'inline-block',
              }} />
              {live ? 'LIVE' : 'SYNCING'}
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
          padding: `0 ${iosLayout.screenMargin}px 12px`, WebkitOverflowScrolling: 'touch',
        }}>
          {CATEGORIES.map((c) => {
            const activeCat = c === state.activeCategory;
            return (
              <div
                key={c}
                className="pressable pressable-sm"
                onClick={() => { hapticLight(); dispatch({ type: 'SET_CATEGORY', category: c }); }}
                style={{
                  padding: '7px 13px', borderRadius: 9999,
                  background: activeCat ? C.categoryChipActiveBg : C.categoryChipBg,
                  color: activeCat ? C.categoryChipActiveText : C.categoryChipText,
                  fontSize: 15, fontWeight: activeCat ? 650 : 500,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  letterSpacing: -0.2,
                }}
              >
                {c}
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
          padding: `4px ${iosLayout.screenMargin}px 24px`,
          display: 'flex', flexDirection: 'column', gap: 10,
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
          <div style={{ textAlign: 'center', color: C.faint, padding: 48, fontSize: 15 }}>No markets found</div>
        )}
        {feed.map((m) => <MarketCard key={m.id} market={m} />)}
      </div>
    </div>
  );
}
