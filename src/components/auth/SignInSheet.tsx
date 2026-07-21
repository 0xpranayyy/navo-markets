import { useCallback, useEffect, useRef, useState } from 'react';
import { useLoginWithEmail, useLoginWithOAuth, usePrivy, useWallets } from '@privy-io/react-auth';
import { useTheme } from '../../theme';
import { NavoMark, NavoProductLockup } from '../brand/NavoMark';
import { hapticLight } from '../../utils/haptics';
import { isIos, isStandalonePwa } from '../../utils/pwa';
import type { UserProfile } from '../../types';

type Step = 'choose' | 'email' | 'otp';

export interface SignInSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildProfile: (address: string) => UserProfile | null;
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05 1.88-3.71 1.9-1.6.02-2.11-.94-3.96-.94-1.85 0-2.43.92-3.97.96-1.58.04-2.78-.87-3.76-1.83C2.79 15.25 1.74 10.45 4.26 7.38c1.27-1.7 3.28-2.73 5.34-2.73 1.67 0 2.72.94 4.1.94 1.34 0 2.16-.94 4.09-.94 1.47 0 3.03.8 4.3 2.18-3.78 2.07-3.17 7.46.96 9.45zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 9999,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      animation: 'om-spin 0.7s linear infinite',
    }} />
  );
}

export default function SignInSheet({ open, onClose, onSuccess, buildProfile }: SignInSheetProps) {
  const { colors: C, sheet, resolved } = useTheme();
  const { ready, authenticated, login: privyLogin } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth();
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();

  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState<'apple' | 'google' | 'email' | 'privy' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const completing = useRef(false);

  const reset = useCallback(() => {
    setStep('choose');
    setEmail('');
    setOtp('');
    setBusy(null);
    setError(null);
    completing.current = false;
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const tryComplete = useCallback(async () => {
    if (completing.current || !authenticated || !walletsReady) return;
    const wallet = wallets.find((w) => w.walletClientType === 'privy') ?? wallets[0];
    if (!wallet?.address) return;

    completing.current = true;
    setBusy(null);
    const profile = buildProfile(wallet.address);
    if (profile) {
      hapticLight();
      onSuccess();
    } else {
      completing.current = false;
    }
  }, [authenticated, buildProfile, onClose, onSuccess, wallets, walletsReady]);

  useEffect(() => {
    if (open && authenticated) void tryComplete();
  }, [open, authenticated, wallets, walletsReady, tryComplete]);

  if (!open) return null;

  const loading = Boolean(busy) || oauthLoading
    || emailState.status === 'sending-code'
    || emailState.status === 'submitting-code';

  const runOAuth = async (provider: 'apple' | 'google') => {
    if (!ready || loading) return;
    hapticLight();
    setError(null);
    setBusy(provider);
    try {
      await initOAuth({ provider });
    } catch {
      setError(`${provider === 'apple' ? 'Apple' : 'Google'} sign-in was cancelled or failed. Try again.`);
      setBusy(null);
    }
  };

  const sendEmailCode = async () => {
    const trimmed = email.trim();
    if (!trimmed.includes('@') || loading) return;
    hapticLight();
    setError(null);
    setBusy('email');
    try {
      await sendCode({ email: trimmed });
      setStep('otp');
      setOtp('');
    } catch {
      setError('Could not send code. Check your email and try again.');
    } finally {
      setBusy(null);
    }
  };

  const submitOtp = async () => {
    if (otp.length < 6 || loading) return;
    hapticLight();
    setError(null);
    setBusy('email');
    try {
      await loginWithCode({ code: otp });
    } catch {
      setError('Invalid code. Try again or request a new one.');
      setBusy(null);
    }
  };

  const openPrivyModal = async () => {
    if (!ready || loading) return;
    hapticLight();
    setError(null);
    setBusy('privy');
    try {
      await privyLogin();
    } catch {
      setError('Sign in was cancelled.');
    } finally {
      setBusy(null);
    }
  };

  const pwaHint = isStandalonePwa()
    ? 'You\'re in the Navo app — sign in once to sync your wallet.'
    : isIos()
      ? 'Works with Add to Home Screen — Apple Sign In stays signed in.'
      : 'One account for markets, portfolio, and trading.';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 400 }}>
      <div className="anim-fade" onClick={onClose} style={{ position: 'absolute', inset: 0, background: C.overlay }} />

      <div className="anim-sheetup" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        ...sheet,
        borderRadius: '28px 28px 0 0',
        borderBottom: 'none',
        padding: `8px 22px calc(env(safe-area-inset-bottom, 0px) + 24px)`,
        maxHeight: '92%',
        overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 5, borderRadius: 9999, background: C.sheetHandle, margin: '6px auto 18px', opacity: 0.85 }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <NavoMark size={52} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 8 }}>
            {step === 'otp' ? 'Check your email' : 'Sign in to Navo'}
          </div>
          <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.45, maxWidth: 300, margin: '0 auto' }}>
            {step === 'email'
              ? 'We\'ll send a one-time code — no password needed.'
              : step === 'otp'
                ? `Enter the 6-digit code sent to ${email}`
                : pwaHint}
          </div>
        </div>

        {error && (
          <div style={{
            background: C.redBg, color: C.red, borderRadius: 12, padding: '11px 14px',
            fontSize: 14, fontWeight: 500, marginBottom: 14, textAlign: 'center', lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        {step === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(isIos() || isStandalonePwa()) && (
              <button
                type="button"
                className="pressable auth-btn auth-btn-apple"
                disabled={loading}
                onClick={() => void runOAuth('apple')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', border: 'none', borderRadius: 9999, padding: '16px 20px',
                  background: resolved === 'dark' ? '#FFFFFF' : '#000000',
                  color: resolved === 'dark' ? '#000000' : '#FFFFFF',
                  fontSize: 17, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                  opacity: loading && busy !== 'apple' ? 0.6 : 1,
                }}
              >
                {busy === 'apple' ? <Spinner color={resolved === 'dark' ? '#000' : '#fff'} /> : <AppleIcon />}
                Continue with Apple
              </button>
            )}

            <button
              type="button"
              className="pressable auth-btn"
              disabled={loading}
              onClick={() => void runOAuth('google')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', border: `0.5px solid ${C.hair}`, borderRadius: 9999, padding: '16px 20px',
                background: C.groupedSurface ?? C.inputBg,
                color: C.text,
                fontSize: 17, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                opacity: loading && busy !== 'google' ? 0.6 : 1,
              }}
            >
              {busy === 'google' ? <Spinner color={C.blue} /> : <GoogleIcon />}
              Continue with Google
            </button>

            <button
              type="button"
              className="pressable auth-btn"
              disabled={loading}
              onClick={() => { hapticLight(); setStep('email'); setError(null); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', border: `0.5px solid ${C.hair}`, borderRadius: 9999, padding: '16px 20px',
                background: 'transparent',
                color: C.text,
                fontSize: 17, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke={C.sub} strokeWidth="1.8" fill="none" />
                <path d="M3 7l9 6 9-6" stroke={C.sub} strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
              Continue with Email
            </button>

            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <button
                type="button"
                className="pressable"
                disabled={loading}
                onClick={() => void openPrivyModal()}
                style={{
                  background: 'none', border: 'none', color: C.faint, fontSize: 14, fontWeight: 500,
                  padding: '8px 12px', cursor: 'pointer',
                }}
              >
                More options
              </button>
            </div>
          </div>
        )}

        {step === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void sendEmailCode(); }}
              style={{
                width: '100%', padding: '16px 18px', borderRadius: 14, border: `0.5px solid ${C.hair}`,
                background: C.inputBg, color: C.text, fontSize: 17, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              className="pressable"
              disabled={loading || !email.includes('@')}
              onClick={() => void sendEmailCode()}
              style={{
                width: '100%', border: 'none', borderRadius: 9999, padding: '16px 20px',
                background: C.blue, color: '#fff', fontSize: 17, fontWeight: 700,
                opacity: loading || !email.includes('@') ? 0.55 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {busy === 'email' ? 'Sending…' : 'Send code'}
            </button>
            <button type="button" className="pressable" onClick={() => setStep('choose')}
              style={{ background: 'none', border: 'none', color: C.faint, fontSize: 15, padding: 8 }}>
              ← Back
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter') void submitOtp(); }}
              style={{
                width: '100%', padding: '16px 18px', borderRadius: 14, border: `0.5px solid ${C.hair}`,
                background: C.inputBg, color: C.text, fontSize: 28, fontWeight: 700,
                letterSpacing: 8, textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
            <button
              type="button"
              className="pressable"
              disabled={loading || otp.length < 6}
              onClick={() => void submitOtp()}
              style={{
                width: '100%', border: 'none', borderRadius: 9999, padding: '16px 20px',
                background: C.blue, color: '#fff', fontSize: 17, fontWeight: 700,
                opacity: otp.length < 6 ? 0.55 : 1,
              }}
            >
              {busy === 'email' ? 'Verifying…' : 'Continue'}
            </button>
            <button type="button" className="pressable" onClick={() => void sendEmailCode()}
              style={{ background: 'none', border: 'none', color: C.blue, fontSize: 15, padding: 8 }}>
              Resend code
            </button>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <NavoProductLockup size={28} color={C.faint} />
          <div style={{ fontSize: 11, color: C.faint, marginTop: 10, lineHeight: 1.4 }}>
            Secured by Privy · Your keys stay on-device
          </div>
        </div>
      </div>
    </div>
  );
}
