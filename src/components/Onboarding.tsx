import { useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme';
import { markOnboardingDone } from '../utils/storage';
import { CATEGORIES } from '../constants/categories';
import LiveMarketTeaser from './onboarding/LiveMarketTeaser';
import ProbabilityDemo from './onboarding/ProbabilityDemo';
import PortfolioPreview from './onboarding/PortfolioPreview';
import { BackgroundOrbs } from './onboarding/shared';
import { isIos, isStandalonePwa } from '../utils/pwa';
import { hapticLight } from '../utils/haptics';
import type { Category } from '../types';

const STEPS = [
  {
    title: 'Live markets, real prices',
    body: 'Every question is a tradable market. Prices move as news breaks and traders react.',
    visual: 'markets' as const,
  },
  {
    title: 'Odds you can trade',
    body: 'A 65¢ Yes share means the crowd thinks there’s a 65% chance. Pay less than $1, win $1 if right.',
    visual: 'probability' as const,
  },
  {
    title: 'Track your edge',
    body: 'See open positions, P/L, and trade history update in real time as markets move.',
    visual: 'portfolio' as const,
  },
  {
    title: 'What interests you?',
    body: 'Pick a category to start with. You can always explore everything later.',
    visual: 'categories' as const,
  },
];

const INTEREST_CATEGORIES = CATEGORIES.filter((c): c is Category => c !== 'Trending');

export default function Onboarding() {
  const { dispatch } = useApp();
  const { openSignIn } = useAuth();
  const { colors: C, glassBlur, glassShine, resolved } = useTheme();
  const [step, setStep] = useState(0);
  const [interest, setInterest] = useState<Category>('Politics');
  const touchStart = useRef<number | null>(null);

  const last = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = (category?: Category) => {
    markOnboardingDone();
    if (category) dispatch({ type: 'SET_CATEGORY', category });
    dispatch({ type: 'SET_PHASE', phase: 'app' });
  };

  const finishWithSignIn = () => {
    markOnboardingDone();
    dispatch({ type: 'SET_CATEGORY', category: interest });
    dispatch({ type: 'SET_PHASE', phase: 'app' });
  };

  const openSignInFlow = () => {
    hapticLight();
    openSignIn(finishWithSignIn);
  };

  const onTouchStart = (x: number) => { touchStart.current = x; };
  const onTouchEnd = (x: number) => {
    if (touchStart.current === null) return;
    const delta = x - touchStart.current;
    touchStart.current = null;
    if (delta < -50 && step < STEPS.length - 1) setStep(step + 1);
    if (delta > 50 && step > 0) setStep(step - 1);
  };

  const renderVisual = () => {
    switch (current.visual) {
      case 'markets':
        return <div style={{ width: '100%', maxWidth: 300 }}><LiveMarketTeaser compact /></div>;
      case 'probability':
        return <ProbabilityDemo />;
      case 'portfolio':
        return <PortfolioPreview />;
      case 'categories':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 320 }}>
            {INTEREST_CATEGORIES.map((c) => {
              const active = interest === c;
              return (
                <div key={c} className="pressable" onClick={() => setInterest(c)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 9999,
                    background: active ? C.blueBg : C.inputBg,
                    color: active ? C.blue : C.sub,
                    fontSize: 14,
                    fontWeight: 700,
                    border: active ? `1.5px solid ${C.blue}44` : `1.5px solid transparent`,
                  }}>
                  {c}
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="anim-fade" style={{ position: 'absolute', inset: 0, background: C.bgDeep, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <BackgroundOrbs resolved={resolved} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 0' }}>
        {step > 0 ? (
          <div className="pressable pressable-sm" onClick={() => setStep(step - 1)}
            style={{ width: 36, height: 36, borderRadius: 9999, background: C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="17" viewBox="0 0 10 17"><path d="M9 1L1 8.5l8 7.5" stroke={C.text} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        ) : <div style={{ width: 36 }} />}

        <div style={{ fontSize: 12, fontWeight: 700, color: C.faint, letterSpacing: 0.5 }}>
          {step + 1} / {STEPS.length}
        </div>

        <div className="pressable pressable-sm" onClick={() => finish()} style={{ position: 'relative', overflow: 'hidden', borderRadius: 9999, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: C.landingTitle }}>
          <div style={{ ...glassBlur, borderRadius: 9999 }} />
          <div style={glassShine(9999)} />
          <span style={{ position: 'relative' }}>Skip</span>
        </div>
      </div>

      <div
        key={step}
        className="anim-fadeslide"
        onTouchStart={(e) => onTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
        style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center', minHeight: 0 }}
      >
        <div style={{ marginBottom: 28, width: '100%', display: 'flex', justifyContent: 'center' }}>
          {renderVisual()}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.landingTitle, letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 12, maxWidth: 320 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 15, color: C.landingSub, lineHeight: 1.55, maxWidth: 320 }}>
          {current.body}
        </div>
        {step < STEPS.length - 1 && (
          <div style={{ fontSize: 12, color: C.faint, marginTop: 20, fontWeight: 600 }}>
            Swipe to continue →
          </div>
        )}
      </div>

      <div style={{ position: 'relative', padding: '0 26px calc(env(safe-area-inset-bottom, 0px) + 32px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 7,
              height: 7,
              borderRadius: 9999,
              background: i === step ? C.blue : C.divider,
              transition: 'all 0.25s ease',
            }} />
          ))}
        </div>

        {last ? (
          <>
            <div className="pressable" onClick={openSignInFlow}
              style={{
                borderRadius: 9999, padding: 16, textAlign: 'center',
                background: isIos() || isStandalonePwa() ? '#FFFFFF' : C.primaryButtonBg,
                color: isIos() || isStandalonePwa() ? '#000000' : C.primaryButtonText,
                fontWeight: 700, fontSize: 16, marginBottom: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
              {(isIos() || isStandalonePwa()) ? 'Sign in with Apple' : 'Sign in to trade'}
            </div>
            <div className="pressable" onClick={() => finish(interest)}
              style={{ borderRadius: 9999, padding: 16, textAlign: 'center', background: C.blue, color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 24px rgba(10,132,255,0.25)' }}>
              Browse {interest} markets
            </div>
          </>
        ) : (
          <div className="pressable" onClick={() => setStep(step + 1)}
            style={{ borderRadius: 9999, padding: 16, textAlign: 'center', background: C.blue, color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 24px rgba(10,132,255,0.25)' }}>
            Continue
          </div>
        )}
      </div>
    </div>
  );
}
