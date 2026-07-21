import { useState } from 'react';
import { useTheme, formatCash } from '../../theme';

export default function ProbabilityDemo() {
  const { colors: C, card } = useTheme();
  const [yesPrice] = useState(65);
  const [stake] = useState(20);
  const shares = Math.round(stake / (yesPrice / 100));
  const payout = shares;
  const profit = payout - stake;

  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <div style={{ ...card, borderRadius: 18, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
          Example trade
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Yes shares</div>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>Market thinks 65% likely</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>{yesPrice}¢</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div style={{ background: C.inputBg, borderRadius: 12, padding: '10px 6px' }}>
            <div style={{ fontSize: 11, color: C.faint, marginBottom: 4 }}>You pay</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{formatCash(stake)}</div>
          </div>
          <div style={{ background: C.inputBg, borderRadius: 12, padding: '10px 6px' }}>
            <div style={{ fontSize: 11, color: C.faint, marginBottom: 4 }}>Shares</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{shares}</div>
          </div>
          <div style={{ background: C.greenBg, borderRadius: 12, padding: '10px 6px' }}>
            <div style={{ fontSize: 11, color: C.green, marginBottom: 4 }}>If Yes wins</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{formatCash(payout)}</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 1.5 }}>
        Each share pays <strong style={{ color: C.text }}>$1</strong> if you're right.
        {' '}Buy at {yesPrice}¢ → profit <span style={{ color: C.green, fontWeight: 700 }}>+{formatCash(profit)}</span> on a {formatCash(stake)} bet.
      </div>
    </div>
  );
}
