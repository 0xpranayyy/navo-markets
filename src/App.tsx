import { useApp } from './store/AppContext';
import { useTheme } from './theme';
import OfflineBanner from './components/OfflineBanner';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import TicketSheet from './components/TicketSheet';
import MarketsScreen from './screens/MarketsScreen';
import SearchScreen from './screens/SearchScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import MarketDetail from './screens/MarketDetail';
import BiometricGate from './components/BiometricGate';
import InstallPrompt from './components/InstallPrompt';
import CashOutSheet from './components/CashOutSheet';

/** Soft ambient washes so Liquid Glass chrome has something to refract. */
function AmbientField() {
  const { colors: C, resolved } = useTheme();
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: -120, left: -80, width: 340, height: 340, borderRadius: 9999,
        background: `radial-gradient(circle, ${C.ambientTop} 0%, transparent 70%)`,
        filter: 'blur(8px)',
        opacity: resolved === 'dark' ? 1 : 0.9,
      }} />
      <div style={{
        position: 'absolute', top: '38%', right: -120, width: 300, height: 300, borderRadius: 9999,
        background: `radial-gradient(circle, ${C.ambientMid} 0%, transparent 70%)`,
        filter: 'blur(12px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 40, left: -40, width: 280, height: 280, borderRadius: 9999,
        background: `radial-gradient(circle, ${C.ambientBottom} 0%, transparent 70%)`,
        filter: 'blur(10px)',
      }} />
    </div>
  );
}

export default function App() {
  const { state, dispatch } = useApp();
  const { colors: C } = useTheme();

  return (
    <BiometricGate>
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', background: C.bgDeep }}>
        <div style={{
          position: 'relative', width: '100%', maxWidth: 430, height: '100%', overflow: 'hidden',
          background: C.bg,
        }}>
          <AmbientField />
          <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
            <OfflineBanner />
            {state.phase === 'landing' && <Landing />}
            {state.phase === 'onboarding' && <Onboarding />}
            {state.phase === 'app' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                {state.tab === 'markets' && <MarketsScreen />}
                {state.tab === 'search' && <SearchScreen />}
                {state.tab === 'portfolio' && <PortfolioScreen />}
                {state.tab === 'profile' && <ProfileScreen />}
                <TabBar />
                {state.selectedId && <MarketDetail />}
                {state.settingsOpen && <SettingsScreen />}
                <InstallPrompt />
              </div>
            )}
            {state.ticket && <TicketSheet />}
            {state.cashOutOpen && <CashOutSheet onClose={() => dispatch({ type: 'CLOSE_CASH_OUT' })} />}
            {state.toast && <Toast />}
          </div>
        </div>
      </div>
    </BiometricGate>
  );
}
