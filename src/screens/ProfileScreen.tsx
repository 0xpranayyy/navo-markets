import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import { deriveSafeAddress, loadTradingSession } from '../api/trading/session';
import { copyText } from '../utils/clipboard';
import { clearSession } from '../utils/storage';
import { useTheme, formatCash } from '../theme';
import { GroupedList, LargeTitle, ListRow, NavIconButton, PrimaryButton, SectionHeader } from '../components/ios/controls';
import { iosLayout, iosType } from '../theme/typography';

export default function ProfileScreen() {
  const { state, dispatch, refreshPortfolio, setupTrading, transferToSafe, withdrawToEoa } = useApp();
  const { user, authenticated, ready, login, logout } = useAuth();
  const { colors: C } = useTheme();
  const [builderReady, setBuilderReady] = useState<boolean | null>(null);

  useEffect(() => {
    api.isBuilderConfigured().then(setBuilderReady).catch(() => setBuilderReady(false));
  }, []);

  const walletLoading = authenticated && !ready;
  const tradingReady = Boolean(user?.address && loadTradingSession(user.address)?.ready);
  const safeAddress = user?.safeAddress
    ?? (user?.address ? (loadTradingSession(user.address)?.safeAddress ?? deriveSafeAddress(user.address)) : null);

  const handleLogout = async () => {
    clearSession();
    await logout();
    dispatch({ type: 'SET_PHASE', phase: 'landing' });
  };

  const handleLogin = async () => {
    const profile = await login();
    if (!profile) return;
    await refreshPortfolio();
  };

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyText(text);
    dispatch({
      type: 'SHOW_TOAST',
      toast: ok
        ? { title: 'Copied', msg: `${label} copied`, variant: 'success' }
        : { title: 'Copy failed', msg: 'Could not copy', variant: 'error' },
    });
  };

  return (
    <div className="anim-fadeslide" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <LargeTitle
        trailing={
          <NavIconButton label="Settings" onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}>
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path d="M10 12.2a2.2 2.2 0 100-4.4 2.2 2.2 0 000 4.4z" fill={C.text} />
              <path d="M16.4 11.1l1.2.9a1 1 0 01.2 1.3l-1.1 1.9a1 1 0 01-1.2.5l-1.4-.3a7.2 7.2 0 01-1.2.7l-.2 1.4a1 1 0 01-1 .9H8.5a1 1 0 01-1-.9l-.2-1.4a7.2 7.2 0 01-1.2-.7l-1.4.3a1 1 0 01-1.2-.5L2.2 13.3a1 1 0 01.2-1.3l1.2-.9-.2-1.4a7 7 0 010-1.4l.2-1.4-1.2-.9a1 1 0 01-.2-1.3l1.1-1.9a1 1 0 011.2-.5l1.4.3a7.2 7.2 0 011.2-.7l.2-1.4A1 1 0 018.5 2h3a1 1 0 011 .9l.2 1.4c.43.18.83.41 1.2.7l1.4-.3a1 1 0 011.2.5l1.1 1.9a1 1 0 01-.2 1.3l-1.2.9.2 1.4c.04.23.06.47.06.7s-.02.47-.06.7l.2 1.4z" fill="none" stroke={C.text} strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </NavIconButton>
        }
      >
        Profile
      </LargeTitle>

      <div className="no-scrollbar ios-scroll" style={{
        flex: 1, overflowY: 'auto', padding: `8px ${iosLayout.screenMargin}px 24px`,
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, padding: '4px 4px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 9999, background: C.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 20px rgba(10,132,255,0.25)',
          }}>
            {user?.initials ?? '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...iosType.title2, color: C.text }}>{user?.name ?? 'Guest'}</div>
            <div style={{ ...iosType.subheadline, color: C.sub, marginTop: 2 }}>
              {walletLoading
                ? 'Wallet loading…'
                : authenticated
                  ? `${formatCash(state.cash)} available`
                  : 'Not signed in'}
            </div>
            {user?.address && (
              <div
                className="pressable"
                onClick={() => void handleCopy(user.address, 'Wallet address')}
                style={{ fontSize: 12, color: C.faint, marginTop: 3, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              >
                {user.address.slice(0, 6)}…{user.address.slice(-4)}
              </div>
            )}
          </div>
        </div>

        {!authenticated && (
          <div style={{ marginBottom: 20 }}>
            <PrimaryButton label="Sign in to Trade" onClick={() => void handleLogin()} color={C.blue} />
          </div>
        )}

        {authenticated && (
          <>
            {builderReady === false && (
              <div style={{
                borderRadius: 14, padding: 14, marginBottom: 16,
                background: C.redBg, border: `0.5px solid ${C.red}33`,
              }}>
                <div style={{ fontSize: 15, fontWeight: 650, color: C.red, marginBottom: 4 }}>Trading not configured</div>
                <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45 }}>
                  {import.meta.env.DEV
                    ? <>Add builder credentials to <code style={{ color: C.faint }}>.env.local</code> and run <code style={{ color: C.faint }}>npm run dev</code>.</>
                    : <>Sign server unreachable. Set builder env vars on Vercel.</>}
                </div>
              </div>
            )}

            <SectionHeader>Trading</SectionHeader>
            <GroupedList style={{ marginBottom: 22 }}>
              <ListRow
                title="Status"
                trailing={
                  <span style={{ fontSize: 15, fontWeight: 600, color: tradingReady ? C.green : C.faint }}>
                    {tradingReady ? 'Enabled' : 'Not set up'}
                  </span>
                }
                last={!safeAddress && tradingReady}
              />
              {safeAddress && (
                <ListRow
                  title="Trading wallet"
                  subtitle={`${safeAddress.slice(0, 10)}…${safeAddress.slice(-6)}`}
                  onClick={() => void handleCopy(safeAddress, 'Trading wallet address')}
                  last={tradingReady}
                />
              )}
              {!tradingReady && (
                <div style={{ padding: 12 }}>
                  <PrimaryButton
                    label={
                      state.settingUpTrading
                        ? 'Setting up…'
                        : walletLoading
                          ? 'Wallet loading…'
                          : builderReady === false
                            ? 'Configure builder first'
                            : 'Enable Trading'
                    }
                    onClick={() => void setupTrading()}
                    color={C.blue}
                    disabled={state.settingUpTrading || walletLoading || builderReady === false}
                  />
                </div>
              )}
            </GroupedList>

            <SectionHeader>Wallet</SectionHeader>
            <GroupedList style={{ marginBottom: 22 }}>
              <ListRow title="Portfolio" subtitle="Positions, history, watchlist" onClick={() => dispatch({ type: 'SET_TAB', tab: 'portfolio' })} />
              <ListRow title="Deposit funds" subtitle="USDC via Polymarket bridge or card" onClick={() => dispatch({ type: 'OPEN_DEPOSIT' })} />
              {tradingReady && (
                <ListRow title="Move to trading wallet" subtitle="Wrap USDC → pUSD" onClick={() => void transferToSafe()} />
              )}
              {tradingReady && (
                <ListRow title="Withdraw to deposit wallet" subtitle="Unwrap pUSD → USDC" onClick={() => void withdrawToEoa()} />
              )}
              <ListRow title="Cash out to bank" subtitle="Sell USDC via MoonPay or Coinbase" onClick={() => dispatch({ type: 'OPEN_CASH_OUT' })} last />
            </GroupedList>
          </>
        )}

        <SectionHeader>App</SectionHeader>
        <GroupedList style={{ marginBottom: 22 }}>
          <ListRow title="Settings" subtitle="Appearance, notifications, data" onClick={() => dispatch({ type: 'OPEN_SETTINGS' })} last={!authenticated} />
          {authenticated && (
            <ListRow title="Log Out" onClick={() => void handleLogout()} destructive last />
          )}
        </GroupedList>
      </div>
    </div>
  );
}
