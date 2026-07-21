import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useTheme, formatVolume } from '../../theme';
import type { Market } from '../../types';
import { topMarkets } from '../../utils/marketFeed';

export default function LiveMarketTeaser({ compact = false }: { compact?: boolean }) {
  const { colors: C, card, resolved } = useTheme();
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    let cancelled = false;
    void api.getMarkets().then((list) => {
      if (cancelled) return;
      const top = topMarkets(list, compact ? 1 : 2);
      setMarkets(top);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [compact]);

  if (!markets.length) {
    return (
      <div style={{ ...card, borderRadius: 16, padding: 16, opacity: 0.85 }}>
        <div style={{ height: 10, width: '40%', borderRadius: 4, background: C.inputBg, marginBottom: 10 }} />
        <div style={{ height: 14, width: '85%', borderRadius: 4, background: C.inputBg, marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 36, borderRadius: 10, background: C.greenBg }} />
          <div style={{ flex: 1, height: 36, borderRadius: 10, background: C.redBg }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {markets.map((m, i) => (
        <div key={m.id} className={compact ? undefined : `anim-float-${i}`}
          style={{
            ...card,
            borderRadius: 16,
            padding: compact ? 12 : 14,
            transform: compact ? undefined : `rotate(${i === 0 ? -1.5 : 1.2}deg)`,
            boxShadow: resolved === 'dark'
              ? '0 12px 32px rgba(0,0,0,0.35)'
              : '0 8px 24px rgba(0,0,0,0.08)',
          }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {m.image ? (
              <img src={m.image} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {m.initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: C.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m.question}
              </div>
              <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{m.category} · {formatVolume(m.volume)}</div>
            </div>
            {m.type === 'binary' && (
              <div style={{ fontSize: 18, fontWeight: 800, color: C.green, flexShrink: 0 }}>{m.yes}%</div>
            )}
          </div>
          {!compact && m.type === 'binary' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1, background: C.greenBg, color: C.green, borderRadius: 8, padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
                Yes · {m.yes}¢
              </div>
              <div style={{ flex: 1, background: C.redBg, color: C.red, borderRadius: 8, padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
                No · {100 - (m.yes ?? 0)}¢
              </div>
            </div>
          )}
        </div>
      ))}
      <div style={{ fontSize: 11, color: C.faint, textAlign: 'center', fontWeight: 600, letterSpacing: 0.3 }}>
        LIVE FROM POLYMARKET
      </div>
    </div>
  );
}
