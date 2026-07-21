import { useEffect, useState } from 'react';
import { useTheme } from '../theme';
import { NavoMark } from './brand/NavoMark';
import { isBiometricEnabled, authenticateBiometric } from '../native/biometric';

export default function BiometricGate({ children }: { children: React.ReactNode }) {
  const { colors: C } = useTheme();
  const [locked, setLocked] = useState(() => isBiometricEnabled());

  useEffect(() => {
    if (!isBiometricEnabled()) {
      setLocked(false);
      return;
    }
    void authenticateBiometric('Unlock Navo').then((ok) => setLocked(!ok));
  }, []);

  const unlock = () => {
    void authenticateBiometric('Unlock Navo').then((ok) => {
      if (ok) setLocked(false);
    });
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="navo-app-shell" style={{ background: C.bgDeep }}>
      <div className="navo-app-frame" style={{
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `calc(var(--navo-safe-top) + 32px) 32px calc(var(--navo-safe-bottom) + 32px)`,
        gap: 16,
      }}>
        <NavoMark size={56} />
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Navo is locked</div>
        <div style={{ fontSize: 14, color: C.faint, textAlign: 'center', lineHeight: 1.5 }}>
          Use Face ID or Touch ID to continue
        </div>
        <div className="pressable" onClick={unlock}
          style={{ marginTop: 12, padding: '14px 28px', borderRadius: 9999, background: C.blue, color: '#fff', fontWeight: 700, fontSize: 16 }}>
          Unlock
        </div>
      </div>
    </div>
  );
}
