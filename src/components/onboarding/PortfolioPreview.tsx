import { useTheme, formatCash } from '../../theme';

export default function PortfolioPreview() {
  const { colors: C, card } = useTheme();

  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <div style={{ ...card, borderRadius: 18, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.faint, fontWeight: 600, marginBottom: 4 }}>Portfolio value</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>{formatCash(248.50)}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>+{formatCash(24.30)} open P/L</div>
      </div>
      <div style={{ ...card, borderRadius: 14, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>US</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>Fed cuts rates in Q3?</div>
          <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginTop: 3 }}>Yes · 42 shares</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{formatCash(18.90)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.green }}>+$4.20</div>
        </div>
      </div>
    </div>
  );
}
