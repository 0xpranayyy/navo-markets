import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../auth/AuthProvider';
import { useTheme, formatCash } from '../theme';
import { copyText } from '../utils/clipboard';
import { isStandalonePwa } from '../utils/pwa';

/**
 * Cash-out flow: Safe → EOA (if needed), then open a fiat offramp
 * (MoonPay Sell / Coinbase) with the deposit wallet address.
 * Privy only provides on-ramp; bank sell is via external partners.
 */
export default function CashOutSheet({ onClose }: { onClose: () => void }) {
  const { state, withdrawToEoa } = useApp();
  const { user, authenticated } = useAuth();
  const { colors: C, card, sheet } = useTheme();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'confirm' | 'done'>('confirm');

  const address = user?.address ?? '';
  const cash = state.cash;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const prepare = async () => {
    if (!authenticated || !address) return;
    setBusy(true);
    try {
      if (cash > 0.01) {
        await withdrawToEoa();
      }
      setStep('done');
    } catch {
      // toast already shown by withdrawToEoa
    } finally {
      setBusy(false);
    }
  };

  const openOfframp = (kind: 'moonpay' | 'coinbase') => {
    if (!address) return;
    const url = kind === 'moonpay'
      ? `https://sell.moonpay.com/?defaultCurrencyCode=usdc_polygon&walletAddress=${encodeURIComponent(address)}`
      : `https://www.coinbase.com/price/usd-coin`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 280 }}>
      <div className="anim-fade" onClick={onClose} style={{ position: 'absolute', inset: 0, background: C.overlay }} />
      <div className="anim-sheetup" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, maxWidth: isStandalonePwa() ? undefined : 430, margin: '0 auto',
        ...sheet,
        borderRadius: '24px 24px 0 0',
        borderBottom: 'none',
        padding: '12px 20px calc(var(--navo-safe-bottom) + 24px)',
      }}>
        <div style={{ width: 40, height: 5, borderRadius: 9999, background: C.sheetHandle, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>Cash out</div>
        <div style={{ fontSize: 14, color: C.faint, lineHeight: 1.45, marginBottom: 18 }}>
          Move USDC to your deposit wallet, then sell to your bank via MoonPay or Coinbase.
        </div>

        {step === 'confirm' ? (
          <>
            <div style={{ ...card, borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.faint, fontWeight: 600 }}>Trading balance</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginTop: 4 }}>{formatCash(cash)}</div>
              <div style={{ fontSize: 12, color: C.faint, marginTop: 8, wordBreak: 'break-all' }}>
                Deposit wallet: {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : '—'}
              </div>
            </div>
            <div className="pressable" onClick={() => !busy && void prepare()}
              style={{
                borderRadius: 14, padding: 16, textAlign: 'center', background: C.blue, color: '#fff',
                fontWeight: 700, fontSize: 16, opacity: busy ? 0.6 : 1, marginBottom: 10,
              }}>
              {busy ? 'Moving funds…' : cash > 0.01 ? 'Withdraw & continue' : 'Continue to bank sell'}
            </div>
            <div className="pressable" onClick={onClose}
              style={{ borderRadius: 14, padding: 14, textAlign: 'center', color: C.sub, fontWeight: 600, fontSize: 15 }}>
              Cancel
            </div>
          </>
        ) : (
          <>
            <div style={{ ...card, borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.green, marginBottom: 8 }}>Ready to sell</div>
              <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.45, marginBottom: 10 }}>
                USDC is on your deposit wallet. Open a partner to sell to your bank account.
              </div>
              <div className="pressable" onClick={() => void copyText(address).then(() => {})}
                style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>
                Copy wallet address
              </div>
            </div>
            <div className="pressable" onClick={() => openOfframp('moonpay')}
              style={{ borderRadius: 14, padding: 16, textAlign: 'center', background: C.blue, color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
              Sell with MoonPay
            </div>
            <div className="pressable" onClick={() => openOfframp('coinbase')}
              style={{ borderRadius: 14, padding: 16, textAlign: 'center', background: C.inputBg, color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
              Open Coinbase
            </div>
            <div className="pressable" onClick={onClose}
              style={{ borderRadius: 14, padding: 14, textAlign: 'center', color: C.sub, fontWeight: 600, fontSize: 15 }}>
              Done
            </div>
          </>
        )}
      </div>
    </div>
  );
}
