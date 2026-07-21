import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import { deriveSafeAddress, loadTradingSession } from '../api/trading/session';
import { copyText } from '../utils/clipboard';
import { clearSession } from '../utils/storage';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullRefreshIndicator from '../components/PullRefreshIndicator';
import ErrorState from '../components/ErrorState';
import { PortfolioSkeleton } from '../components/Skeleton';
import { useTheme, formatCash } from '../theme';
import { GroupedList, LargeTitle, ListRow, PrimaryButton, SecondaryButton, SectionHeader } from '../components/ios/controls';
import { iosLayout, iosType } from '../theme/typography';
import { hapticLight } from '../utils/haptics';

function findMarketId(markets: ReturnType<typeof useApp>['state']['markets'], marketId: string) {
  const m = markets.find((x) => x.id === marketId || x.conditionId === marketId);
  return m?.id ?? null;
}

export default function PortfolioScreen() {
  const { state, dispatch, refreshPortfolio, openSellTicket, setupTrading, transferToSafe, cancelOpenOrder, cancelAllOpenOrders } = useApp();
  const { user, authenticated, login, logout } = useAuth();
  const { colors: C, card } = useTheme();
  const { pull, refreshing, handlers } = usePullToRefresh(refreshPortfolio, authenticated);
  const [eoaBalance, setEoaBalance] = useState(0);
  const [builderReady, setBuilderReady] = useState<boolean | null>(null);

  const tradingReady = Boolean(user?.address && loadTradingSession(user.address)?.ready);
  const safeAddress = user?.address
    ? (loadTradingSession(user.address)?.safeAddress ?? deriveSafeAddress(user.address))
    : null;

  useEffect(() => {
    api.isBuilderConfigured().then(setBuilderReady).catch(() => setBuilderReady(false));
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setEoaBalance(0);
      return;
    }
    api.getEoaUsdcBalance().then(setEoaBalance).catch(() => setEoaBalance(0));
  }, [authenticated, state.cash]);

  const positions = state.positions.map((p) => {
    const value = (p.shares * p.currentPrice) / 100;
    const cost = (p.shares * p.avgPrice) / 100;
    return { ...p, value, pl: value - cost };
  });
  const totalPL = positions.reduce((a, p) => a + p.pl, 0);
  const portfolioValue = state.cash + positions.reduce((a, p) => a + p.value, 0);
  const watched = state.markets.filter((m) => state.watchlist.includes(m.id));

  const handleLogout = async () => {
    clearSession();
    await logout();
    dispatch({ type: 'SET_PHASE', phase: 'landing' });
  };

  const handleLogin = async () => {
    const profile = await login();
    if (!profile) return false;
    await refreshPortfolio();
    return true;
  };

  const handleDeposit = async () => {
    if (!authenticated) {
      await handleLogin();
      return;
    }
    dispatch({ type: 'OPEN_DEPOSIT' });
  };

  const handleEnableTrading = async () => {
    if (!authenticated) {
      const ok = await handleLogin();
      if (!ok) return;
    }
    await setupTrading();
  };

  const handleCopyWallet = async () => {
    if (!safeAddress) return;
    const ok = await copyText(safeAddress);
    dispatch({
      type: 'SHOW_TOAST',
      toast: ok ? { title: 'Copied', msg: 'Trading wallet address copied', variant: 'success' } : { title: 'Copy failed', msg: 'Could not copy address', variant: 'error' },
    });
  };

  return (
    <div className="anim-fadeslide" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <LargeTitle>Portfolio</LargeTitle>
      <PullRefreshIndicator pull={pull} refreshing={refreshing} loading={state.loadingPortfolio && authenticated && !state.positions.length} />
      <div className="no-scrollbar ios-scroll" {...handlers} style={{
        flex: 1, overflowY: 'auto', padding: `8px ${iosLayout.screenMargin}px 24px`,
        WebkitOverflowScrolling: 'touch',
      }}>
        {state.portfolioError && authenticated && (
          <ErrorState title="Couldn't sync portfolio" message={state.portfolioError} onRetry={() => void refreshPortfolio()} />
        )}
        {state.loadingPortfolio && authenticated && !state.positions.length && !state.portfolioError && (
          <PortfolioSkeleton />
        )}
        {builderReady === false && (
          <div style={{ ...card, borderRadius: 14, padding: 14, marginBottom: 16, border: `1px solid ${C.red}33` }}>
            <div style={{ fontSize: 15, fontWeight: 650, color: C.red, marginBottom: 4 }}>Trading not configured</div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45 }}>
              {import.meta.env.DEV
                ? <>Add <code style={{ color: C.faint }}>POLYMARKET_BUILDER_*</code> to <code style={{ color: C.faint }}>.env.local</code> and restart <code style={{ color: C.faint }}>npm run dev</code>.</>
                : <>Trading backend is not reachable. Deploy the sign server and set <code style={{ color: C.faint }}>VITE_POLYMARKET_SIGN_URL</code>.</>}
            </div>
          </div>
        )}

        <div style={{ ...card, borderRadius: iosLayout.groupedRadius + 2, padding: '20px 18px', marginBottom: 22 }}>
          <div style={{ ...iosType.footnote, color: C.faint, marginBottom: 2 }}>Portfolio value</div>
          <div className="ios-tabular" style={{
            ...iosType.largeTitle, fontSize: 40, fontWeight: 800, color: C.text, marginBottom: 4,
          }}>
            {formatCash(portfolioValue)}
          </div>
          <div className="ios-tabular" style={{
            ...iosType.subheadline, fontWeight: 600, color: totalPL >= 0 ? C.green : C.red,
          }}>
            {(totalPL >= 0 ? '+' : '') + formatCash(totalPL)} open P/L
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, paddingTop: 14, borderTop: `0.33px solid ${C.divider}`,
          }}>
            <div style={{ ...iosType.subheadline, color: C.sub }}>Cash</div>
            <div className="ios-tabular" style={{ ...iosType.subheadline, fontWeight: 600, color: C.text }}>
              {formatCash(state.cash)}
            </div>
          </div>

          {authenticated && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {!tradingReady ? (
                <PrimaryButton
                  label={state.settingUpTrading ? 'Setting up…' : builderReady === false ? 'Configure builder first' : 'Enable Trading'}
                  onClick={() => void handleEnableTrading()}
                  color={C.blue}
                  disabled={state.settingUpTrading || builderReady === false}
                />
              ) : (
                <div style={{
                  background: C.greenBg, color: C.green, fontWeight: 650, fontSize: 15,
                  borderRadius: 12, padding: '12px 14px', textAlign: 'center', letterSpacing: -0.2,
                }}>
                  Trading enabled
                </div>
              )}
              <PrimaryButton
                label={state.cash < 1 ? 'Deposit USDC' : 'Add Funds'}
                onClick={() => void handleDeposit()}
                color={C.blue}
              />
              <SecondaryButton
                label="Cash Out to Bank"
                onClick={() => dispatch({ type: 'OPEN_CASH_OUT' })}
              />
              {tradingReady && eoaBalance >= 0.5 && (
                <SecondaryButton
                  label={`Move ${formatCash(eoaBalance)} to Trading Wallet`}
                  onClick={() => void transferToSafe()}
                />
              )}
              {safeAddress && (
                <div
                  className="pressable"
                  onClick={() => void handleCopyWallet()}
                  style={{ marginTop: 4, fontSize: 12, color: C.faint, lineHeight: 1.4, textAlign: 'center' }}
                >
                  Trading wallet {safeAddress.slice(0, 6)}…{safeAddress.slice(-4)} · tap to copy
                </div>
              )}
            </div>
          )}
          {!authenticated && (
            <div style={{ marginTop: 16 }}>
              <PrimaryButton label="Sign In to Trade" onClick={() => void handleLogin()} color={C.blue} />
            </div>
          )}
        </div>

        <SectionHeader>Positions</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {!positions.length && (
            <div style={{ ...card, padding: 22, textAlign: 'center', color: C.faint, fontSize: 15, borderRadius: 14 }}>
              {state.loadingPortfolio ? 'Loading positions…' : 'No open positions yet'}
            </div>
          )}
          {positions.map((p) => (
            <div key={p.id} style={{ ...card, padding: 14, display: 'flex', gap: 10, alignItems: 'center', borderRadius: 14 }}>
              <div className="pressable" onClick={() => {
                hapticLight();
                const id = findMarketId(state.markets, p.marketId);
                if (id) dispatch({ type: 'OPEN_MARKET', id });
              }} style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: p.marketColor, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                }}>{p.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.3, letterSpacing: -0.2 }}>{p.question}</div>
                  <div style={{ fontSize: 13, color: p.sideColor, fontWeight: 650, marginTop: 3 }}>{p.side} · {p.shares} shares</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 650, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{formatCash(p.value)}</div>
                  <div style={{ fontSize: 13, fontWeight: 650, color: p.pl >= 0 ? C.green : C.red, fontVariantNumeric: 'tabular-nums' }}>
                    {(p.pl >= 0 ? '+$' : '-$') + Math.abs(p.pl).toFixed(2)}
                  </div>
                </div>
              </div>
              {tradingReady && (
                <div className="pressable pressable-sm" onClick={() => { hapticLight(); openSellTicket(p); }}
                  style={{ background: C.redBg, color: C.red, borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  Sell
                </div>
              )}
            </div>
          ))}
        </div>

        {authenticated && tradingReady && (
          <>
            <SectionHeader
              trailing={state.openOrders.length > 0 ? (
                <div className="pressable ios-hit-44" onClick={() => { hapticLight(); void cancelAllOpenOrders(); }}
                  style={{ ...iosType.subheadline, color: C.red, padding: '4px 2px', minHeight: 'auto', minWidth: 'auto' }}>
                  Cancel All
                </div>
              ) : undefined}
            >
              Open orders
            </SectionHeader>
            <GroupedList style={{ marginBottom: 24 }}>
              {!state.openOrders.length && !state.loadingOpenOrders && (
                <div style={{ padding: 20, textAlign: 'center', color: C.faint, fontSize: 15 }}>No open limit orders</div>
              )}
              {state.loadingOpenOrders && !state.openOrders.length && (
                <div style={{ padding: 20, textAlign: 'center', color: C.faint, fontSize: 15 }}>Loading orders…</div>
              )}
              {state.openOrders.map((o, i) => (
                <div key={o.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: i < state.openOrders.length - 1 ? `0.33px solid ${C.divider}` : 'none',
                }}>
                  <div className="pressable" onClick={() => { hapticLight(); dispatch({ type: 'OPEN_MARKET', id: o.marketId }); }}
                    style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: -0.2 }}>
                      {o.question}
                    </div>
                    <div style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                      {o.side} {o.outcome} · {o.remaining.toFixed(1)} left @ {o.price}¢
                      {o.sizeMatched > 0 ? ` · ${o.sizeMatched.toFixed(1)} filled` : ''}
                    </div>
                    {o.originalSize > 0 && (
                      <div style={{ marginTop: 6, height: 3, borderRadius: 9999, background: C.progressTrack, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, (o.sizeMatched / o.originalSize) * 100)}%`,
                          height: '100%', background: C.blue, borderRadius: 9999,
                        }} />
                      </div>
                    )}
                  </div>
                  <div className="pressable pressable-sm" onClick={() => { hapticLight(); void cancelOpenOrder(o.id); }}
                    style={{ background: C.redBg, color: C.red, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    Cancel
                  </div>
                </div>
              ))}
            </GroupedList>
          </>
        )}

        {watched.length > 0 && (
          <>
            <SectionHeader>Watchlist</SectionHeader>
            <GroupedList style={{ marginBottom: 24 }}>
              {watched.map((m, i) => (
                <ListRow
                  key={m.id}
                  title={m.question}
                  subtitle={m.type === 'binary' ? `${m.yes}% chance` : m.category}
                  onClick={() => dispatch({ type: 'OPEN_MARKET', id: m.id })}
                  trailing={m.type === 'binary' ? (
                    <span style={{ fontSize: 17, fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{m.yes}%</span>
                  ) : undefined}
                  last={i === watched.length - 1}
                />
              ))}
            </GroupedList>
          </>
        )}

        <SectionHeader>History</SectionHeader>
        <GroupedList>
          {!state.orders.length && (
            <div style={{ padding: 20, textAlign: 'center', color: C.faint, fontSize: 15 }}>No trades yet</div>
          )}
          {state.orders.map((o, i) => (
            <div key={o.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: i < state.orders.length - 1 ? `0.33px solid ${C.divider}` : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: -0.2 }}>{o.question}</div>
                <div style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>
                  {o.time} · {o.action === 'sell' ? 'Sold' : 'Bought'} {o.shares} {o.side}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 650, color: C.text, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{formatCash(o.amount)}</div>
            </div>
          ))}
        </GroupedList>

        {authenticated && (
          <div
            className="pressable"
            onClick={() => { hapticLight(); void handleLogout(); }}
            style={{ marginTop: 28, textAlign: 'center', fontSize: 17, color: C.red, fontWeight: 400, letterSpacing: -0.2 }}
          >
            Log Out
          </div>
        )}
      </div>
    </div>
  );
}
