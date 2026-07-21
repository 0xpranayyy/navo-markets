import { useApp } from '../store/AppContext';
import { useAuth } from '../auth/AuthProvider';
import { markOnboardingDone } from '../utils/storage';
import { useTheme } from '../theme';
import LiveMarketTeaser from './onboarding/LiveMarketTeaser';
import { BackgroundOrbs, FeaturePills } from './onboarding/shared';
import { NavoHeaderLockup, NavoProductLockup } from './brand/NavoMark';
import { isIos, isStandalonePwa } from '../utils/pwa';
import { hapticLight } from '../utils/haptics';

export default function Landing() {
  const { dispatch } = useApp();
  const { authenticated, ready, openSignIn } = useAuth();
  const { colors: C, resolved } = useTheme();

  const enterApp = () => {
    markOnboardingDone();
    dispatch({ type: 'SET_PHASE', phase: 'app' });
  };

  const startOnboarding = () => {
    dispatch({ type: 'SET_PHASE', phase: ready && authenticated ? 'app' : 'onboarding' });
  };

  return (
    <div className="anim-fade navo-phase-screen" style={{ background: C.bgDeep, overflow: 'hidden' }}>
      <div className="navo-mesh-bg" aria-hidden />
      <BackgroundOrbs resolved={resolved} />

      <div style={{ position: 'relative', padding: 'max(var(--navo-safe-top), 8px) 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <NavoHeaderLockup />
        <div className="pressable pressable-sm ios-hit-44" onClick={enterApp}
          style={{ fontSize: 17, fontWeight: 400, color: C.blue, padding: '6px 4px', display: 'flex', alignItems: 'center', letterSpacing: -0.41 }}>
          Skip
        </div>
      </div>

      <div className="no-scrollbar" style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ marginBottom: 20, alignSelf: 'flex-start' }}>
          <NavoProductLockup size={56} />
        </div>

        <div style={{ alignSelf: 'stretch', marginBottom: 24 }}>
          <div className="navo-hero-gradient" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.12, letterSpacing: 0.37, marginBottom: 10 }}>
            Predict what happens next.
          </div>
          <div style={{ fontSize: 17, color: C.landingSub, lineHeight: 1.35, marginBottom: 16, letterSpacing: -0.41, maxWidth: 520 }}>
            Real markets on elections, sports, crypto, and culture — priced by the crowd, traded in seconds.
          </div>
          <FeaturePills faint={C.landingSub} chipBg={C.inputBg} align="start" />
        </div>

        <div style={{ width: '100%', maxWidth: 520, marginBottom: 16 }}>
          <LiveMarketTeaser />
        </div>

        {isStandalonePwa() && (
          <div style={{
            alignSelf: 'stretch', marginTop: 8, padding: '12px 14px', borderRadius: 14,
            background: C.blueBg, border: `0.5px solid ${C.blue}33`,
            fontSize: 13, color: C.blue, fontWeight: 600, lineHeight: 1.45, textAlign: 'center',
          }}>
            Installed as an app — sign in once and your wallet stays ready.
          </div>
        )}
      </div>

      <div style={{ position: 'relative', padding: '12px 16px calc(var(--navo-safe-bottom) + 16px)', flexShrink: 0 }}>
        <div className="pressable" onClick={startOnboarding}
          style={{
            borderRadius: 14,
            padding: 16,
            textAlign: 'center',
            background: C.blue,
            color: '#fff',
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: -0.41,
            marginBottom: 10,
            minHeight: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          Get started
        </div>

        <div className="pressable" onClick={() => { hapticLight(); openSignIn(enterApp); }}
          style={{
            borderRadius: 14,
            padding: 16,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: -0.41,
            color: C.blue,
            marginBottom: 8,
            background: C.inputBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 50,
          }}>
          {(isIos() || isStandalonePwa()) && (
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05 1.88-3.71 1.9-1.6.02-2.11-.94-3.96-.94-1.85 0-2.43.92-3.97.96-1.58.04-2.78-.87-3.76-1.83C2.79 15.25 1.74 10.45 4.26 7.38c1.27-1.7 3.28-2.73 5.34-2.73 1.67 0 2.72.94 4.1.94 1.34 0 2.16-.94 4.09-.94 1.47 0 3.03.8 4.3 2.18-3.78 2.07-3.17 7.46.96 9.45zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          )}
          Sign in
        </div>

        <div className="pressable" onClick={enterApp}
          style={{ textAlign: 'center', fontSize: 15, fontWeight: 400, color: C.blue, padding: 10, marginBottom: 12, letterSpacing: -0.24 }}>
          Browse markets without an account
        </div>

        <div className="navo-trust-row">
          <span><span className="navo-trust-dot" aria-hidden /> Polygon</span>
          <span><span className="navo-trust-dot" aria-hidden /> Privy Auth</span>
          <span><span className="navo-trust-dot" aria-hidden /> Gnosis Safe</span>
        </div>
      </div>
    </div>
  );
}
