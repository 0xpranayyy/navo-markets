import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme';
import { isIos, isStandalonePwa } from '../utils/pwa';

const DISMISS_KEY = 'navo-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Android Chrome install prompt + iOS “Add to Home Screen” tip. */
export default function InstallPrompt() {
  const { colors: C, sheet } = useTheme();
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalonePwa()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const onBip = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setVisible(true);
      setIosHint(false);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    // iOS Safari: no beforeinstallprompt — show Share tip after a short delay
    const t = window.setTimeout(() => {
      if (!deferred.current && isIos() && !isStandalonePwa()) {
        setIosHint(true);
        setVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.clearTimeout(t);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    const ev = deferred.current;
    if (!ev) return;
    await ev.prompt();
    const choice = await ev.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    else dismiss();
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div className="liquid-chrome anim-fadeslide" style={{
      position: 'absolute', left: 14, right: 14, bottom: 'calc(var(--navo-tab-bar-clearance) + 8px)',
      zIndex: 200, borderRadius: 20, padding: '14px 16px',
      ...sheet,
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <img src="/icon-192.png" alt="" width={44} height={44} style={{
        borderRadius: 12, flexShrink: 0,
        boxShadow: '0 4px 14px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          {iosHint ? 'Add Navo to Home Screen' : 'Install Navo'}
        </div>
        <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.45 }}>
          {iosHint
            ? 'Tap Share, then “Add to Home Screen” for a full-screen app with Apple Sign In.'
            : 'Install for faster access, offline browsing, and a home-screen icon.'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {!iosHint && (
            <div className="pressable" onClick={() => void install()}
              style={{ padding: '8px 14px', borderRadius: 10, background: C.blue, color: '#fff', fontSize: 13, fontWeight: 700 }}>
              Install
            </div>
          )}
          <div className="pressable" onClick={dismiss}
            style={{ padding: '8px 14px', borderRadius: 10, background: C.inputBg, color: C.sub, fontSize: 13, fontWeight: 600 }}>
            Not now
          </div>
        </div>
      </div>
    </div>
  );
}
