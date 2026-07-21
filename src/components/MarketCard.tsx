import { useApp } from '../store/AppContext';
import { useTheme, formatVolume } from '../theme';
import { iosLayout, iosType } from '../theme/typography';
import type { Market } from '../types';
import { marketEndMs } from '../utils/marketFeed';

function endingSoonLabel(m: Market): string | null {
  const endMs = marketEndMs(m);
  if (endMs == null) return null;
  const days = Math.ceil((endMs - Date.now()) / 86_400_000);
  if (days < 0 || days > 7) return null;
  if (days === 0) return 'Ends today';
  if (days === 1) return 'Ends tomorrow';
  return `Ends in ${days}d`;
}

export default function MarketCard({ market: m }: { market: Market }) {
  const { state, dispatch, openTicket } = useApp();
  const { colors: C } = useTheme();
  const isBinary = m.type === 'binary';
  const watched = state.watchlist.includes(m.id);
  const changeColor = !isBinary ? C.sub : m.change > 0 ? C.green : m.change < 0 ? C.red : C.sub;
  const changeLabel = isBinary ? (m.change > 0 ? '+' : '') + m.change.toFixed(1) + '%' : '';
  const endingSoon = endingSoonLabel(m);

  const buy = (e: React.MouseEvent, kind: 'yes' | 'no') => {
    e.stopPropagation();
    openTicket(m, kind);
  };

  const toggleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_WATCH', id: m.id });
  };

  return (
    <div
      className="pressable liquid-card"
      onClick={() => dispatch({ type: 'OPEN_MARKET', id: m.id })}
      style={{
        background: C.groupedSurface,
        borderRadius: iosLayout.cardRadius,
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {m.image ? (
          <img src={m.image} alt="" style={{
            width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: m.color, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>{m.initials}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...iosType.headline, color: C.text }}>{m.question}</div>
          <div style={{ ...iosType.footnote, color: C.faint, marginTop: 3 }}>
            {m.category} · {formatVolume(m.volume24h ?? m.volume)} vol
            {endingSoon ? ` · ${endingSoon}` : ''}
          </div>
        </div>
        <div className="pressable pressable-sm ios-hit-44" onClick={toggleWatch}
          style={{
            width: iosLayout.minTouch, height: iosLayout.minTouch, flexShrink: 0, margin: -8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <svg width="18" height="17" viewBox="0 0 17 16" aria-hidden>
            <path d="M8.5 1l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L4 14.8l.9-5L1.3 6.3l5-.7L8.5 1z"
              fill={watched ? '#FFD60A' : 'none'} stroke={watched ? '#FFD60A' : C.starInactive} strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </div>
        {isBinary && (
          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 44 }}>
            <div className="ios-tabular" style={{ ...iosType.title2, color: changeColor }}>{m.yes}%</div>
            <div style={{ ...iosType.caption1, fontWeight: 600, color: changeColor }}>{changeLabel}</div>
          </div>
        )}
      </div>
      {isBinary ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="pressable ios-hit-44" onClick={(e) => buy(e, 'yes')} style={{
            flex: 1, background: C.greenBg, color: C.green, borderRadius: 10, padding: '10px 8px',
            textAlign: 'center', ...iosType.subheadline, fontWeight: 600,
            minHeight: iosLayout.minTouch, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>Yes · {m.yes}¢</div>
          <div className="pressable ios-hit-44" onClick={(e) => buy(e, 'no')} style={{
            flex: 1, background: C.redBg, color: C.red, borderRadius: 10, padding: '10px 8px',
            textAlign: 'center', ...iosType.subheadline, fontWeight: 600,
            minHeight: iosLayout.minTouch, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>No · {100 - (m.yes ?? 0)}¢</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {m.outcomes!.slice(0, 3).map((o, i) => (
            <div key={o.name} className="pressable" onClick={(e) => { e.stopPropagation(); openTicket(m, 'outcome', i); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 28 }}>
              <div style={{ flex: 1, ...iosType.footnote, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</div>
              <div style={{ flex: 2, height: 4, borderRadius: 9999, background: C.progressTrack, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${o.price}%`, background: o.color, borderRadius: 9999 }} />
              </div>
              <div className="ios-tabular" style={{ width: 40, textAlign: 'right', ...iosType.footnote, fontWeight: 600, color: C.text }}>{o.price}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
