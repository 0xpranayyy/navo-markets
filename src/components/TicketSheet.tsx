import { useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../api/client';
import { useTheme, formatCash } from '../theme';
import { hapticLight } from '../utils/haptics';
import { PrimaryButton, SegmentedControl } from './ios/controls';
import { iosLayout, iosType } from '../theme/typography';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function TicketSheet() {
  const { state, dispatch, confirmOrder } = useApp();
  const { colors: C, sheet } = useTheme();
  const tk = state.ticket!;
  const openPrice = useRef(tk.openPrice ?? tk.price);
  const isSell = tk.mode === 'sell';
  const orderKind = tk.orderKind ?? 'market';
  const isLimit = orderKind === 'limit';
  const amt = parseFloat(state.amount) || 0;
  const shares = isSell ? amt : Math.round(amt / (tk.price / 100));
  const payout = isSell ? (shares * tk.price) / 100 : shares;
  const priceMoved = Math.abs(tk.price - openPrice.current) >= 3;
  const close = () => dispatch({ type: 'CLOSE_TICKET' });

  useEffect(() => {
    openPrice.current = tk.openPrice ?? tk.price;
  }, [tk.marketId, tk.tokenId, tk.mode]);

  useEffect(() => {
    if (isSell) return;
    let cancelled = false;
    const poll = () => {
      void api.getLivePrice(tk.tokenId).then((mid) => {
        if (!cancelled && mid !== null) {
          dispatch({ type: 'UPDATE_TICKET_PRICE', price: mid });
        }
      });
    };
    poll();
    const id = window.setInterval(poll, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [tk.tokenId, isSell, dispatch]);

  const quickAmounts = isSell
    ? [
        { label: '25%', value: String(Math.floor((tk.maxShares ?? 0) * 0.25)) },
        { label: '50%', value: String(Math.floor((tk.maxShares ?? 0) * 0.5)) },
        { label: '75%', value: String(Math.floor((tk.maxShares ?? 0) * 0.75)) },
        { label: 'Max', value: String(Math.floor(tk.maxShares ?? 0)) },
      ]
    : [
        { label: '$1', value: '1' },
        { label: '$20', value: '20' },
        { label: '$100', value: '100' },
        { label: 'Max', value: String(Math.floor(state.cash)) },
      ];

  const pressKey = (k: string) => {
    if (state.ordering) return;
    hapticLight();
    dispatch({ type: 'PRESS_KEY', key: k });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300 }}>
      <div className="anim-fade" onClick={close} style={{ position: 'absolute', inset: 0, background: C.overlay }} />
      <div className="anim-sheetup" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        ...sheet,
        borderRadius: `${iosLayout.sheetRadius}px ${iosLayout.sheetRadius}px 0 0`,
        borderBottom: 'none',
        padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 20px)',
        display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '94%',
      }}>
        <div style={{ width: 36, height: 5, borderRadius: 9999, background: C.sheetHandle, margin: '4px auto 6px', opacity: 0.85 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div>
            <div style={{ ...iosType.footnote, color: C.faint }}>{isSell ? 'Sell' : 'Buy'}</div>
            <div style={{ ...iosType.title2, color: tk.color }}>{tk.sideLabel}</div>
          </div>
          <div
            role="button"
            aria-label="Close"
            className="pressable pressable-sm ios-hit-44"
            onClick={close}
            style={{
              width: iosLayout.minTouch, height: iosLayout.minTouch,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 9999, background: C.closeButtonBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `0.5px solid ${C.hair}`,
            }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 1l8 8M9 1L1 9" stroke={C.closeButtonText} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          </div>
        </div>

        <div style={{
          fontSize: 13, color: C.faint, textAlign: 'center', lineHeight: 1.35,
          maxHeight: 36, overflow: 'hidden', padding: '0 8px', letterSpacing: -0.1,
        }}>
          {tk.question}
        </div>

        {!isSell && (
          <SegmentedControl
            options={[
              { id: 'market' as const, label: 'Market' },
              { id: 'limit' as const, label: 'Limit' },
            ]}
            value={orderKind}
            onChange={(kind) => dispatch({ type: 'SET_ORDER_KIND', kind })}
          />
        )}

        <div style={{
          textAlign: 'center', fontSize: 48, fontWeight: 300, color: C.text,
          letterSpacing: -1.2, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
          padding: '4px 0',
        }}>
          {isSell ? (state.amount === '' ? '0' : state.amount) : `$${state.amount === '' ? '0' : state.amount}`}
          {isSell && <span style={{ fontSize: 17, fontWeight: 500, color: C.faint, marginLeft: 6 }}>shares</span>}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.faint,
          padding: '0 6px', fontVariantNumeric: 'tabular-nums',
        }}>
          <span>{shares} shares</span>
          <span style={{ color: priceMoved ? C.red : C.faint }}>Live {tk.price}¢</span>
          <span>{isSell ? 'Proceeds' : 'Payout'} {formatCash(payout)}</span>
        </div>

        {priceMoved && !isSell && (
          <div style={{
            background: C.redBg, color: C.red, borderRadius: 12, padding: '10px 12px',
            fontSize: 13, fontWeight: 600, textAlign: 'center', letterSpacing: -0.1,
          }}>
            Price moved — review before confirming
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {quickAmounts.map((v) => (
            <div
              key={v.label}
              className="pressable"
              onClick={() => { hapticLight(); dispatch({ type: 'SET_AMOUNT', amount: v.value }); }}
              style={{
                flex: 1, background: C.inputBg, color: C.blue, borderRadius: 10, padding: 10,
                textAlign: 'center', fontSize: 15, fontWeight: 650, letterSpacing: -0.2,
                border: `0.5px solid ${C.hair}`,
              }}
            >
              {v.label}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {KEYS.map((k) => (
            <div
              key={k}
              className="pressable pressable-key"
              onClick={() => pressKey(k)}
              style={{
                height: 52, borderRadius: 12, background: C.keyBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 400, color: C.text,
                opacity: state.ordering ? 0.4 : 1,
                border: `0.5px solid ${C.hair}`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {k}
            </div>
          ))}
        </div>

        <PrimaryButton
          label={state.ordering
            ? (isSell ? 'Selling…' : 'Placing…')
            : isSell ? 'Confirm Sell' : isLimit ? 'Place Limit Order' : 'Confirm Order'}
          onClick={() => void confirmOrder()}
          color={isSell ? C.red : tk.color}
          textColor={isSell ? '#fff' : C.buyConfirmText}
          disabled={state.ordering}
        />
      </div>
    </div>
  );
}
