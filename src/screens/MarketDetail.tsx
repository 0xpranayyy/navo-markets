import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../api/client';
import { useTheme, formatCash, formatVolume } from '../theme';
import { shareMarket } from '../utils/share';
import { hapticLight } from '../utils/haptics';
import type { ActivityItem, OrderBook, Position } from '../types';
import PriceChart from '../components/PriceChart';
import OrderBookView from '../components/OrderBook';
import { NavIconButton, SegmentedControl } from '../components/ios/controls';

const TIMEFRAMES = ['1H', '6H', '1D', '1W', 'ALL'] as const;
const LIVE_POLL_MS = 8000;

function findPosition(positions: Position[], marketId: string, conditionId?: string) {
  return positions.find((p) => p.marketId === marketId || p.marketId === conditionId);
}

export default function MarketDetail() {
  const { state, dispatch, openTicket, openSellTicket } = useApp();
  const { colors: C, sectionLabel, resolved, sheet } = useTheme();
  const m = state.markets.find((x) => x.id === state.selectedId);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [book, setBook] = useState<OrderBook | null>(null);
  const [trend, setTrend] = useState<number[]>(m?.trend ?? []);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [liveYes, setLiveYes] = useState<number | null>(null);
  const [chartOutcomeIdx, setChartOutcomeIdx] = useState(0);

  const isBinary = m?.type === 'binary';
  const yesPrice = liveYes ?? m?.yes ?? 50;
  const prevYes = m?.yes ?? 50;
  const liveChange = liveYes !== null ? liveYes - prevYes : m?.change ?? 0;
  const changeColor = !isBinary ? C.blue : liveChange > 0 ? C.green : liveChange < 0 ? C.red : C.sub;
  const position = m ? findPosition(state.positions, m.id, m.conditionId) : undefined;
  const chartTokenId = isBinary
    ? m?.tokenIds?.[0]
    : m?.outcomes?.[chartOutcomeIdx]?.tokenId ?? m?.tokenIds?.[chartOutcomeIdx];

  useEffect(() => {
    if (!m) return;
    let cancelled = false;
    const loadBook = () => {
      if (isBinary && m.tokenIds?.[0]) {
        api.getOrderBook(m.id, m).then((b) => { if (!cancelled) setBook(b); }).catch(() => { if (!cancelled) setBook(null); });
      }
    };
    loadBook();
    api.getActivity(m).then((a) => { if (!cancelled) setActivity(a); }).catch(() => { if (!cancelled) setActivity([]); });
    const bookTimer = isBinary ? window.setInterval(loadBook, LIVE_POLL_MS) : undefined;
    return () => {
      cancelled = true;
      if (bookTimer) window.clearInterval(bookTimer);
    };
  }, [m?.id, isBinary]);

  useEffect(() => {
    if (!chartTokenId) {
      setTrend(m?.trend ?? []);
      return;
    }
    api.getPriceHistory(chartTokenId, state.timeframe).then((history) => {
      setTrend(history.length >= 2 ? history : []);
    });
  }, [m?.id, chartTokenId, state.timeframe]);

  useEffect(() => {
    if (!m?.tokenIds?.[0] || !isBinary) {
      setLiveYes(null);
      return;
    }
    if (m.yes != null) setLiveYes(m.yes);
    let cancelled = false;
    const poll = async () => {
      const mid = await api.getLivePrice(m.tokenIds![0]);
      if (!cancelled && mid !== null) {
        setLiveYes(mid);
        dispatch({ type: 'PATCH_MARKET_PRICES', updates: [{ id: m.id, yes: mid }] });
      }
    };
    poll();
    const id = window.setInterval(poll, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [m?.id, m?.tokenIds, m?.yes, isBinary, dispatch]);

  useEffect(() => {
    if (!state.selectedId || m) return;
    setLoadingMarket(true);
    void api.loadMissingMarkets([state.selectedId]).then((markets) => {
      if (markets.length) dispatch({ type: 'MERGE_MARKETS', markets });
      setLoadingMarket(false);
    }).catch(() => setLoadingMarket(false));
  }, [state.selectedId, m]);

  if (!m) {
    return (
      <div className="anim-slideright" style={{ position: 'absolute', inset: 0, zIndex: 200, background: C.bg, display: 'flex', flexDirection: 'column', padding: 20 }}>
        <NavIconButton label="Back" onClick={() => dispatch({ type: 'CLOSE_MARKET' })}>
          <svg width="10" height="17" viewBox="0 0 10 17"><path d="M9 1L1 8.5l8 7.5" stroke={C.text} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </NavIconButton>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.faint, fontSize: 15 }}>
          {loadingMarket ? 'Loading market…' : 'Market not found'}
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    hapticLight();
    const ok = await shareMarket(m.question, m.id);
    dispatch({
      type: 'SHOW_TOAST',
      toast: ok
        ? { title: 'Shared', msg: 'Market link copied or shared', variant: 'success' }
        : { title: 'Share failed', msg: 'Could not share this market', variant: 'error' },
    });
  };

  const watched = state.watchlist.includes(m.id);
  const timeframe = (TIMEFRAMES.includes(state.timeframe as typeof TIMEFRAMES[number])
    ? state.timeframe
    : '1D') as typeof TIMEFRAMES[number];

  return (
    <div className="anim-slideright" style={{
      position: 'absolute', inset: 0, zIndex: 200,
      ...sheet,
      borderRadius: 0,
      borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: 'calc(var(--navo-safe-top) + 10px) 16px 8px',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <NavIconButton label="Back" onClick={() => dispatch({ type: 'CLOSE_MARKET' })}>
          <svg width="10" height="17" viewBox="0 0 10 17"><path d="M9 1L1 8.5l8 7.5" stroke={C.text} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </NavIconButton>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.sub, letterSpacing: -0.2, textAlign: 'center' }}>{m.category}</div>
        <NavIconButton label="Share" onClick={() => void handleShare()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M12 10.5v2.5a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h2.5M10 2h4v4M6.5 9.5L14 2" stroke={C.text} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </NavIconButton>
        <NavIconButton label="Watchlist" onClick={() => dispatch({ type: 'TOGGLE_WATCH', id: m.id })}>
          <svg width="17" height="16" viewBox="0 0 17 16">
            <path d="M8.5 1l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L4 14.8l.9-5L1.3 6.3l5-.7L8.5 1z"
              fill={watched ? '#FFD60A' : 'none'} stroke={watched ? '#FFD60A' : C.starInactive} strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </NavIconButton>
      </div>

      <div className="no-scrollbar ios-scroll" style={{
        flex: 1, overflowY: 'auto', padding: '2px 20px 150px',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
          {m.image ? (
            <img src={m.image} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: m.color, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>{m.initials}</div>
          )}
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.25, flex: 1, letterSpacing: -0.4 }}>{m.question}</div>
        </div>

        {position && (
          <div style={{
            background: C.surface, borderRadius: 14, padding: 14, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
            border: `0.5px solid ${C.hair}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: C.faint, fontWeight: 500 }}>Your position</div>
              <div style={{ fontSize: 15, fontWeight: 650, color: C.text, marginTop: 2, letterSpacing: -0.2 }}>
                {position.shares} {position.side} · avg {position.avgPrice}¢
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
                Value {formatCash((position.shares * position.currentPrice) / 100)}
              </div>
            </div>
            <div className="pressable pressable-sm" onClick={() => { hapticLight(); openSellTicket(position); }}
              style={{ background: C.redBg, color: C.red, borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>
              Sell
            </div>
          </div>
        )}

        {isBinary ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{
                fontSize: 48, fontWeight: 800, color: changeColor,
                letterSpacing: -1.4, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              }}>{yesPrice}%</div>
              <div style={{ fontSize: 15, fontWeight: 650, color: changeColor, fontVariantNumeric: 'tabular-nums' }}>
                {(liveChange > 0 ? '+' : '') + liveChange.toFixed(1)}%
              </div>
              {liveYes !== null && <div style={{ fontSize: 11, color: C.faint, fontWeight: 650, letterSpacing: 0.3 }}>LIVE</div>}
            </div>
            <div style={{ fontSize: 13, color: C.faint, marginBottom: 16, marginTop: 6 }}>
              chance · {formatVolume(m.volume)} Vol · ends {m.end}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: C.faint, marginBottom: 16 }}>{formatVolume(m.volume)} Vol · ends {m.end}</div>
        )}

        {!isBinary && chartTokenId && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {m.outcomes!.map((o, i) => (
              <div key={o.name} className="pressable pressable-sm" onClick={() => { hapticLight(); setChartOutcomeIdx(i); }}
                style={{
                  padding: '6px 12px', borderRadius: 9999,
                  background: chartOutcomeIdx === i ? C.blueBg : C.inputBg,
                  color: chartOutcomeIdx === i ? C.blue : C.sub,
                  fontSize: 13, fontWeight: 600, letterSpacing: -0.1,
                }}>
                {o.name}
              </div>
            ))}
          </div>
        )}

        <PriceChart trend={trend} color={changeColor} />
        <div style={{ margin: '10px 0 22px' }}>
          <SegmentedControl
            options={TIMEFRAMES.map((tf) => ({ id: tf, label: tf }))}
            value={timeframe}
            onChange={(tf) => dispatch({ type: 'SET_TIMEFRAME', tf })}
          />
        </div>

        {!isBinary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            {m.outcomes!.map((o, i) => (
              <div key={o.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.surface, borderRadius: 14, padding: '12px 14px',
                border: `0.5px solid ${C.hair}`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 9999, background: o.color, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: -0.2 }}>{o.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginRight: 10, fontVariantNumeric: 'tabular-nums' }}>{o.price}%</div>
                <div className="pressable pressable-sm" onClick={() => { hapticLight(); openTicket(m, 'outcome', i); }}
                  style={{ background: C.blueBg, color: C.blue, borderRadius: 9999, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
                  Buy
                </div>
              </div>
            ))}
          </div>
        )}

        {isBinary && book && <OrderBookView book={book} />}

        <div style={{ ...sectionLabel, margin: '8px 0 10px' }}>Recent trades</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
          {!activity.length && <div style={{ color: C.faint, fontSize: 15, padding: '8px 0' }}>No recent activity</div>}
          {activity.map((c, i) => (
            <div key={`${c.name}-${i}`} style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9999, background: c.color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>{c.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 650, color: C.text }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: C.faint }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 14, color: C.sub, marginTop: 2, lineHeight: 1.35 }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isBinary && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 16px calc(var(--navo-safe-bottom) + 16px)',
          display: 'flex', gap: 10,
          background: resolved === 'dark' ? 'rgba(8,9,11,0.72)' : 'rgba(242,242,247,0.78)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderTop: `0.33px solid ${C.divider}`,
        }}>
          <div className="pressable" onClick={() => { hapticLight(); openTicket(m, 'yes', 0, yesPrice); }}
            style={{
              flex: 1, background: C.green,
              color: resolved === 'dark' ? '#052b1e' : '#fff',
              fontWeight: 700, fontSize: 17, borderRadius: 14, padding: 16, textAlign: 'center',
              letterSpacing: -0.3, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
            }}>
            Buy Yes · {yesPrice}¢
          </div>
          <div className="pressable" onClick={() => { hapticLight(); openTicket(m, 'no', 0, yesPrice); }}
            style={{
              flex: 1, background: C.red,
              color: resolved === 'dark' ? '#310007' : '#fff',
              fontWeight: 700, fontSize: 17, borderRadius: 14, padding: 16, textAlign: 'center',
              letterSpacing: -0.3, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            Buy No · {100 - yesPrice}¢
          </div>
        </div>
      )}
    </div>
  );
}
