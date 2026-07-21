import { useApp } from '../store/AppContext';
import { useTheme, formatVolume } from '../theme';
import { iosLayout, iosType } from '../theme/typography';
import type { Market } from '../types';

export default function MarketCard({ market: m }: { market: Market }) {
  const { state, dispatch, openTicket } = useApp();
  const { colors: C } = useTheme();
  const isBinary = m.type === 'binary';
  const watched = state.watchlist.includes(m.id);
  const changeColor = !isBinary ? C.sub : m.change > 0 ? C.green : m.change < 0 ? C.red : C.sub;
  const changeLabel = isBinary ? (m.change > 0 ? '+' : '') + m.change.toFixed(1) + '%' : '';

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
        border: `0.33px solid ${C.divider}`,
        padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        {m.image ? (
          <img src={m.image} alt="" style={{
            width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: m.color, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.18)',
          }}>{m.initials}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...iosType.subheadline, fontWeight: 600, color: C.text, lineHeight: 1.32 }}>{m.question}</div>
          <div style={{ ...iosType.caption1, color: C.faint, marginTop: 4 }}>
            {m.category} · {formatVolume(m.volume24h ?? m.volume)} Vol
          </div>
        </div>
        <div className="pressable pressable-sm ios-hit-44" onClick={toggleWatch}
          style={{
            width: iosLayout.minTouch, height: iosLayout.minTouch, flexShrink: 0, margin: -6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: watched ? 'rgba(255,214,10,0.12)' : 'transparent',
          }}>
          <svg width="15" height="14" viewBox="0 0 17 16">
            <path d="M8.5 1l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L4 14.8l.9-5L1.3 6.3l5-.7L8.5 1z"
              fill={watched ? '#FFD60A' : 'none'} stroke={watched ? '#FFD60A' : C.starInactive} strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          </div>
        </div>
        {isBinary && (
          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 48 }}>
            <div className="ios-tabular" style={{ ...iosType.title2, fontWeight: 800, color: changeColor }}>{m.yes}%</div>
            <div style={{ ...iosType.caption2, fontWeight: 600, color: changeColor }}>{changeLabel}</div>
          </div>
        )}
      </div>
      {isBinary ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="pressable ios-hit-44" onClick={(e) => buy(e, 'yes')} style={{
            flex: 1, background: C.greenBg, color: C.green, borderRadius: iosLayout.groupedRadius, padding: '11px 10px',
            textAlign: 'center', ...iosType.subheadline, fontWeight: 600,
            border: `0.5px solid ${C.green}33`,
            minHeight: iosLayout.minTouch, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>Yes · {m.yes}¢</div>
          <div className="pressable ios-hit-44" onClick={(e) => buy(e, 'no')} style={{
            flex: 1, background: C.redBg, color: C.red, borderRadius: iosLayout.groupedRadius, padding: '11px 10px',
            textAlign: 'center', ...iosType.subheadline, fontWeight: 600,
            border: `0.5px solid ${C.red}33`,
            minHeight: iosLayout.minTouch, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>No · {100 - (m.yes ?? 0)}¢</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.outcomes!.slice(0, 3).map((o, i) => (
            <div key={o.name} className="pressable" onClick={(e) => { e.stopPropagation(); openTicket(m, 'outcome', i); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, fontSize: 13, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</div>
              <div style={{ flex: 2, height: 7, borderRadius: 9999, background: C.progressTrack, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${o.price}%`, background: o.color, borderRadius: 9999 }} />
              </div>
              <div style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{o.price}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
