import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../auth/AuthProvider';
import { fetchBridgeDepositAddresses } from '../api/bridge';
import { useTheme } from '../theme';
import { copyText } from '../utils/clipboard';
import { hapticLight } from '../utils/haptics';

export default function DepositSheet({ onClose }: { onClose: () => void }) {
  const { refreshPortfolio, transferToSafe, dispatch } = useApp();
  const { user, fundWallet } = useAuth();
  const { colors: C, card, sheet } = useTheme();

  const safeAddress = user?.safeAddress ?? user?.depositWalletAddress ?? '';
  const [bridgeEvm, setBridgeEvm] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [loadingBridge, setLoadingBridge] = useState(true);
  const [cardBusy, setCardBusy] = useState(false);
  const [moveBusy, setMoveBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!safeAddress) {
      setLoadingBridge(false);
      setBridgeError('Trading wallet not ready');
      return;
    }
    setLoadingBridge(true);
    setBridgeError(null);
    fetchBridgeDepositAddresses(safeAddress)
      .then((a) => setBridgeEvm(a.evm))
      .catch((err) => setBridgeError(err instanceof Error ? err.message : 'Could not load deposit address'))
      .finally(() => setLoadingBridge(false));
  }, [safeAddress]);

  const copy = async (label: string, value: string) => {
    hapticLight();
    const ok = await copyText(value);
    dispatch({
      type: 'SHOW_TOAST',
      toast: ok
        ? { title: 'Copied', msg: `${label} copied`, variant: 'success' }
        : { title: 'Copy failed', msg: 'Could not copy to clipboard', variant: 'error' },
    });
  };

  const buyWithCard = async () => {
    setCardBusy(true);
    try {
      await fundWallet();
      await transferToSafe();
      await refreshPortfolio();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Card purchase unavailable';
      if (/funding is not enabled/i.test(msg)) {
        setBridgeError(
          'Card buy is off in Privy. Use the Polymarket bridge address below, or enable Funding in dashboard.privy.io → your app → Funding.',
        );
      } else {
        setBridgeError(msg);
      }
    } finally {
      setCardBusy(false);
    }
  };

  const moveToTrading = async () => {
    setMoveBusy(true);
    try {
      await transferToSafe();
      await refreshPortfolio();
    } finally {
      setMoveBusy(false);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 280 }}>
      <div className="anim-fade" onClick={onClose} style={{ position: 'absolute', inset: 0, background: C.overlay }} />
      <div className="anim-sheetup" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        ...sheet,
        borderRadius: '24px 24px 0 0',
        borderBottom: 'none',
        padding: '12px 20px calc(var(--navo-safe-bottom) + 24px)',
        maxHeight: '90%',
        overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 5, borderRadius: 9999, background: C.sheetHandle, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>Deposit USDC</div>
        <div style={{ fontSize: 14, color: C.faint, lineHeight: 1.45, marginBottom: 18 }}>
          Send USDC to your Polymarket trading wallet. Deposits are wrapped to pUSD automatically.
        </div>

        {bridgeError && (
          <div style={{
            background: C.redBg, color: C.red, borderRadius: 12, padding: '11px 14px',
            fontSize: 13, fontWeight: 500, marginBottom: 14, lineHeight: 1.45,
          }}>
            {bridgeError}
          </div>
        )}

        <div style={{ ...card, borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: C.faint, fontWeight: 600, marginBottom: 6 }}>Your trading wallet</div>
          <div style={{ fontSize: 13, color: C.text, wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace' }}>
            {safeAddress || '—'}
          </div>
          {safeAddress && (
            <div className="pressable" onClick={() => void copy('wallet', safeAddress)}
              style={{ fontSize: 13, color: C.blue, fontWeight: 700, marginTop: 10 }}>
              Copy trading wallet
            </div>
          )}
        </div>

        <div style={{ ...card, borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.faint, fontWeight: 600, marginBottom: 6 }}>
            Polymarket bridge (recommended)
          </div>
          {loadingBridge ? (
            <div style={{ fontSize: 14, color: C.sub }}>Loading deposit address…</div>
          ) : bridgeEvm ? (
            <>
              <div style={{ fontSize: 13, color: C.text, wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace' }}>
                {bridgeEvm}
              </div>
              <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.45, marginTop: 10 }}>
                Send USDC or USDC.e on Polygon (or use Polymarket&apos;s supported chains). Funds credit to your trading wallet as pUSD.
              </div>
              <div className="pressable" onClick={() => void copy('bridge', bridgeEvm)}
                style={{ fontSize: 13, color: C.blue, fontWeight: 700, marginTop: 10 }}>
                Copy bridge address
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: C.sub }}>Could not load bridge address</div>
          )}
        </div>

        <div className="pressable" onClick={() => !cardBusy && void buyWithCard()}
          style={{
            borderRadius: 14, padding: 16, textAlign: 'center', background: C.inputBg, color: C.text,
            fontWeight: 700, fontSize: 16, opacity: cardBusy ? 0.6 : 1, marginBottom: 10,
          }}>
          {cardBusy ? 'Opening card buy…' : 'Buy with card (Privy)'}
        </div>

        <div className="pressable" onClick={() => !moveBusy && void moveToTrading()}
          style={{
            borderRadius: 14, padding: 14, textAlign: 'center', color: C.blue, fontWeight: 600, fontSize: 15,
            opacity: moveBusy ? 0.6 : 1, marginBottom: 10,
          }}>
          {moveBusy ? 'Moving…' : 'Already deposited? Move USDC to trading wallet'}
        </div>

        <div className="pressable" onClick={onClose}
          style={{ borderRadius: 14, padding: 14, textAlign: 'center', color: C.sub, fontWeight: 600, fontSize: 15 }}>
          Done
        </div>
      </div>
    </div>
  );
}
