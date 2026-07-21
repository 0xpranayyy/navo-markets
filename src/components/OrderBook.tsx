import { useTheme } from '../theme';
import type { OrderBook as Book } from '../types';

function Side({ label, color, tint, levels, rowBg, rowText }: {
  label: string;
  color: string;
  tint: string;
  levels: Book['yes'];
  rowBg: string;
  rowText: string;
}) {
  const { colors: C } = useTheme();

  if (!levels.length) {
    return (
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color, fontWeight: 700, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 12, color: C.faint, padding: '8px 0' }}>No bids</div>
      </div>
    );
  }
  const max = Math.max(...levels.map((l) => l.size));
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {levels.map((lvl, i) => (
        <div key={i} style={{ position: 'relative', height: 22, marginBottom: 3, borderRadius: 5, overflow: 'hidden', background: rowBg }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round((lvl.size / max) * 100)}%`, background: tint }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '0 8px', fontSize: 11, color: rowText, lineHeight: '22px' }}>
            <span>{lvl.price}¢</span>
            <span>{lvl.size.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderBookView({ book }: { book: Book }) {
  const { colors: C, sectionLabel, resolved } = useTheme();
  const bestYes = book.yes[0]?.price;
  const bestNo = book.no[0]?.price;
  const spread = bestYes !== undefined && bestNo !== undefined ? Math.max(0, 100 - bestYes - bestNo) : null;
  const yesTint = resolved === 'dark' ? 'rgba(23,199,131,0.18)' : 'rgba(36,138,61,0.15)';
  const noTint = resolved === 'dark' ? 'rgba(255,77,103,0.18)' : 'rgba(215,0,21,0.12)';

  return (
    <>
      <div style={sectionLabel}>Order book</div>
      {spread !== null && (
        <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>
          Spread ~{spread}¢ · best Yes {bestYes}¢ · best No {bestNo}¢
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        <Side label="YES bids" color={C.green} tint={yesTint} levels={book.yes} rowBg={C.progressTrack} rowText={C.sub} />
        <Side label="NO bids" color={C.red} tint={noTint} levels={book.no} rowBg={C.progressTrack} rowText={C.sub} />
      </div>
    </>
  );
}
