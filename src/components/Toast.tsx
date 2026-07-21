import { useApp } from '../store/AppContext';
import { useTheme } from '../theme';

const ICONS: Record<string, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M2 12l4-5 3 3 5-7" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 4v5M8 11v1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="1.6" fill="none" />
      <path d="M8 7v4M8 5v1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

export default function Toast() {
  const { state, dispatch } = useApp();
  const { colors: C } = useTheme();
  const t = state.toast!;
  const variant = t.variant ?? 'info';
  const bg = variant === 'success' ? C.green : variant === 'error' ? C.red : C.blue;

  return (
    <div
      className="pressable anim-toast liquid-chrome"
      onClick={() => dispatch({ type: 'HIDE_TOAST' })}
      style={{
        position: 'absolute',
        top: 'calc(var(--navo-safe-top) + 14px)',
        left: 16, right: 16, zIndex: 400,
        background: C.toastBg,
        backdropFilter: 'blur(36px) saturate(180%)',
        WebkitBackdropFilter: 'blur(36px) saturate(180%)',
        borderRadius: 20,
        padding: '12px 14px',
        display: 'flex', gap: 12, alignItems: 'center',
        boxShadow: `${C.tabBarShine}, 0 16px 40px rgba(0,0,0,0.22)`,
        border: `0.5px solid ${C.toastBorder}`,
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 11, background: bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
      }}>
        {ICONS[variant]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.toastText, letterSpacing: -0.2 }}>{t.title}</div>
        <div style={{ fontSize: 13, color: C.toastSub, marginTop: 1, lineHeight: 1.35 }}>{t.msg}</div>
      </div>
    </div>
  );
}
