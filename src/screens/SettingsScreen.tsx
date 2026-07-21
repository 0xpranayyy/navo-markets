import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useTheme, type ThemePreference } from '../theme';
import { isBiometricAvailable, isBiometricEnabled, setBiometricEnabled, verifyBiometric } from '../native/biometric';
import { isPushEnabled, enablePushNotifications, disablePushNotifications } from '../native/push';
import { isNativePlatform } from '../native/platform';
import { isWatchlistAlertsEnabled, setWatchlistAlertsEnabled } from '../utils/watchlistAlerts';
import { GroupedList, ListRow, NavIconButton, SegmentedControl, Toggle } from '../components/ios/controls';

const APPEARANCE: Array<{ id: ThemePreference; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

export default function SettingsScreen() {
  const { dispatch } = useApp();
  const { colors: C, sectionLabel, preference, setPreference, sheet } = useTheme();
  const [pushOn, setPushOn] = useState(isPushEnabled());
  const [alertsOn, setAlertsOn] = useState(isWatchlistAlertsEnabled());
  const [bioOn, setBioOn] = useState(isBiometricEnabled());
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    void isBiometricAvailable().then(setBioAvailable);
  }, []);

  const close = () => dispatch({ type: 'CLOSE_SETTINGS' });

  const togglePush = async () => {
    if (pushOn) {
      await disablePushNotifications();
      setPushOn(false);
      dispatch({ type: 'SHOW_TOAST', toast: { title: 'Notifications off', msg: 'Push alerts disabled', variant: 'info' } });
    } else {
      const ok = await enablePushNotifications();
      setPushOn(ok);
      dispatch({
        type: 'SHOW_TOAST',
        toast: ok
          ? { title: 'Notifications on', msg: isNativePlatform() ? 'FCM/APNs registered on device' : 'Browser notifications enabled', variant: 'success' }
          : { title: 'Permission denied', msg: 'Enable notifications in system settings', variant: 'error' },
      });
    }
  };

  const toggleAlerts = (next: boolean) => {
    if (!pushOn) {
      dispatch({ type: 'SHOW_TOAST', toast: { title: 'Enable notifications first', msg: 'Turn on push notifications above', variant: 'info' } });
      return;
    }
    setWatchlistAlertsEnabled(next);
    setAlertsOn(next);
    dispatch({
      type: 'SHOW_TOAST',
      toast: next
        ? { title: 'Watchlist alerts on', msg: 'Notify when saved markets move 5+ points', variant: 'success' }
        : { title: 'Watchlist alerts off', msg: 'Price move alerts disabled', variant: 'info' },
    });
  };

  const toggleBio = async (next: boolean) => {
    if (!next) {
      setBiometricEnabled(false);
      setBioOn(false);
      dispatch({ type: 'SHOW_TOAST', toast: { title: 'Biometric lock off', msg: 'Face ID / Touch ID disabled', variant: 'info' } });
      return;
    }
    const ok = await verifyBiometric('Enable Face ID for Navo');
    if (ok) {
      setBiometricEnabled(true);
      setBioOn(true);
      dispatch({ type: 'SHOW_TOAST', toast: { title: 'Biometric lock on', msg: 'Unlock with Face ID when opening Navo', variant: 'success' } });
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 250 }}>
      <div className="anim-fade" onClick={close} style={{ position: 'absolute', inset: 0, background: C.overlay }} />
      <div className="anim-slideright" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%',
        ...sheet,
        borderRight: 'none',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: 'calc(var(--navo-safe-top) + 10px) 16px 10px',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <NavIconButton label="Back" onClick={close}>
            <svg width="10" height="17" viewBox="0 0 10 17">
              <path d="M9 1L1 8.5l8 7.5" stroke={C.text} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavIconButton>
          <div style={{ fontSize: 17, fontWeight: 650, color: C.text, letterSpacing: -0.3, flex: 1, textAlign: 'center', marginRight: 36 }}>
            Settings
          </div>
        </div>

        <div className="no-scrollbar ios-scroll" style={{
          flex: 1, overflowY: 'auto',
          padding: '8px 16px calc(var(--navo-safe-bottom) + 32px)',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{ ...sectionLabel, margin: '8px 4px 8px' }}>Appearance</div>
          <GroupedList style={{ marginBottom: 28, padding: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 400, color: C.text, letterSpacing: -0.2, marginBottom: 4 }}>Theme</div>
            <div style={{ fontSize: 13, color: C.faint, marginBottom: 12, lineHeight: 1.35 }}>
              Dark, light, or match your device.
            </div>
            <SegmentedControl
              options={APPEARANCE}
              value={preference}
              onChange={setPreference}
            />
          </GroupedList>

          <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>Notifications & security</div>
          <GroupedList style={{ marginBottom: 28 }}>
            <ListRow
              title="Push notifications"
              subtitle={isNativePlatform() ? 'Native FCM / APNs on iOS & Android' : 'Alerts when the app is installed'}
              trailing={<Toggle on={pushOn} onChange={() => void togglePush()} />}
              onClick={() => void togglePush()}
            />
            <ListRow
              title="Watchlist price alerts"
              subtitle="Alert when a saved market moves 5+ points"
              trailing={<Toggle on={alertsOn && pushOn} onChange={toggleAlerts} />}
              onClick={() => toggleAlerts(!(alertsOn && pushOn))}
              last={!bioAvailable}
            />
            {bioAvailable && (
              <ListRow
                title="Face ID / biometrics"
                subtitle="Require biometrics to open the app"
                trailing={<Toggle on={bioOn} onChange={(v) => void toggleBio(v)} />}
                onClick={() => void toggleBio(!bioOn)}
                last
              />
            )}
          </GroupedList>

          <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>Privacy & security</div>
          <GroupedList style={{ marginBottom: 28 }}>
            <ListRow
              title="Your keys stay on-device"
              subtitle="Wallet keys are held by Privy. Trading API keys are stored locally and cleared on log out."
            />
            <ListRow
              title="Sign server"
              subtitle="Builder HMAC secret never leaves our server. Each sign request requires your wallet signature."
              last
            />
          </GroupedList>

          <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>About</div>
          <GroupedList style={{ marginBottom: 28 }}>
            <ListRow title="Navo" subtitle="Version 0.1.0 · Polymarket client" />
            <ListRow
              title="Polymarket"
              subtitle="Official market rules & resolution"
              onClick={() => window.open('https://polymarket.com', '_blank', 'noreferrer')}
            />
            <ListRow
              title="API documentation"
              subtitle="How Navo connects to Polymarket"
              onClick={() => window.open('https://docs.polymarket.com', '_blank', 'noreferrer')}
              last
            />
          </GroupedList>

          <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>Data</div>
          <GroupedList>
            <ListRow
              title="Clear watchlist"
              subtitle="Remove saved markets on this device"
              onClick={() => {
                dispatch({ type: 'CLEAR_WATCHLIST' });
                dispatch({ type: 'SHOW_TOAST', toast: { title: 'Watchlist cleared', msg: 'Saved markets removed from this device', variant: 'success' } });
              }}
              destructive
              last
            />
          </GroupedList>
        </div>
      </div>
    </div>
  );
}
