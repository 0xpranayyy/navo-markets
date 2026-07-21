import { useApp } from '../store/AppContext';
import { useTheme } from '../theme';
import { iosType } from '../theme/typography';
import type { Tab } from '../types';
import { hapticLight } from '../utils/haptics';

const TABS: Array<{ id: Tab; label: string; icon: (c: string, active: boolean) => React.ReactNode }> = [
  {
    id: 'markets',
    label: 'Markets',
    icon: (c, active) => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="4" y="12" width="4" height="8" rx="1.2" fill={c} opacity={active ? 1 : 0.92} />
        <rect x="10" y="7" width="4" height="13" rx="1.2" fill={c} opacity={active ? 1 : 0.92} />
        <rect x="16" y="3" width="4" height="17" rx="1.2" fill={c} opacity={active ? 1 : 0.92} />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="10.5" cy="10.5" r="6.2" stroke={c} strokeWidth="1.8" fill="none" />
        <path d="M15.5 15.5L20.5 20.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="3.5" y="8" width="17" height="11.5" rx="2.2" stroke={c} strokeWidth="1.8" fill="none" />
        <path d="M8 8V6.2a2 2 0 012-2h4a2 2 0 012 2V8" stroke={c} strokeWidth="1.8" fill="none" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3.6" stroke={c} strokeWidth="1.8" fill="none" />
        <path d="M4.5 19.5c1.4-3.8 4.6-5.6 7.5-5.6s6.1 1.8 7.5 5.6" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
];

/** Floating Liquid Glass pill tab bar. */
export default function TabBar() {
  const { state, dispatch } = useApp();
  const { colors: C, resolved } = useTheme();

  const go = (tab: typeof state.tab) => {
    hapticLight();
    dispatch({ type: 'SET_TAB', tab });
  };

  return (
    <div className="navo-tab-bar-host">
      <div
        className="navo-tab-bar liquid-chrome"
        style={{
          boxShadow: resolved === 'dark'
            ? '0 14px 36px rgba(0,0,0,0.42), 0 2px 8px rgba(0,0,0,0.18)'
            : '0 10px 28px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          background: C.tabBarBg,
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 9999,
          boxShadow: C.tabBarShine,
          border: `0.5px solid ${C.tabBarBorder}`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '14%', right: '14%', height: 1,
          background: resolved === 'dark'
            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
          pointerEvents: 'none', opacity: 0.85,
        }} />
        {TABS.map((t) => {
          const active = state.tab === t.id;
          const color = active ? C.blue : C.tabInactive;
          return (
            <div
              key={t.id}
              className="pressable pressable-sm ios-hit-44"
              onClick={() => go(t.id)}
              role="tab"
              aria-selected={active}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                padding: '4px 10px',
                minWidth: 68,
                borderRadius: 9999,
                background: active ? C.tabActiveBg : 'transparent',
                transition: 'background 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              {t.icon(color, active)}
              <span style={{
                ...iosType.tabLabel,
                fontWeight: active ? 600 : 500,
                color,
                marginTop: 1,
              }}>
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
