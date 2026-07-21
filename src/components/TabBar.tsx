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
      <svg width="25" height="25" viewBox="0 0 25 25" aria-hidden>
        <rect x="3.5" y="13" width="4.5" height="8" rx="1" fill={c} opacity={active ? 1 : 0.95} />
        <rect x="10.25" y="8" width="4.5" height="13" rx="1" fill={c} opacity={active ? 1 : 0.95} />
        <rect x="17" y="3.5" width="4.5" height="17.5" rx="1" fill={c} opacity={active ? 1 : 0.95} />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (c) => (
      <svg width="25" height="25" viewBox="0 0 25 25" aria-hidden>
        <circle cx="11.2" cy="11.2" r="6.4" stroke={c} strokeWidth="1.7" fill="none" />
        <path d="M16.1 16.1L21 21" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: (c) => (
      <svg width="25" height="25" viewBox="0 0 25 25" aria-hidden>
        <rect x="3.5" y="8.5" width="18" height="12" rx="2.2" stroke={c} strokeWidth="1.7" fill="none" />
        <path d="M8.5 8.5V6.8a2 2 0 012-2h4a2 2 0 012 2v1.7" stroke={c} strokeWidth="1.7" fill="none" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (c) => (
      <svg width="25" height="25" viewBox="0 0 25 25" aria-hidden>
        <circle cx="12.5" cy="8.5" r="3.6" stroke={c} strokeWidth="1.7" fill="none" />
        <path d="M5 19.5c1.4-3.6 4.4-5.4 7.5-5.4s6.1 1.8 7.5 5.4" stroke={c} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
];

/** HIG tab bar — full-width translucent bar, 49pt + safe area, system tint. */
export default function TabBar() {
  const { state, dispatch } = useApp();
  const { colors: C } = useTheme();

  const go = (tab: typeof state.tab) => {
    hapticLight();
    dispatch({ type: 'SET_TAB', tab });
  };

  return (
    <nav className="navo-tab-bar-host" aria-label="Primary">
      <div
        className="navo-tab-bar"
        style={{
          background: C.tabBarBg,
          borderTop: `0.33px solid ${C.tabBarBorder}`,
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      >
        {TABS.map((t) => {
          const active = state.tab === t.id;
          const color = active ? C.blue : C.tabInactive;
          return (
            <button
              key={t.id}
              type="button"
              className="pressable pressable-sm navo-tab-item"
              onClick={() => go(t.id)}
              role="tab"
              aria-selected={active}
              aria-label={t.label}
            >
              <span style={{ display: 'flex', height: 28, alignItems: 'center', justifyContent: 'center' }}>
                {t.icon(color, active)}
              </span>
              <span style={{
                ...iosType.tabLabel,
                fontWeight: active ? 600 : 500,
                color,
                marginTop: 1,
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
