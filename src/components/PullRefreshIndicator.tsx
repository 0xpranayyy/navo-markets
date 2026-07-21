import { useTheme } from '../theme';

export default function PullRefreshIndicator({ pull, refreshing, loading }: { pull: number; refreshing: boolean; loading?: boolean }) {
  const { colors: C } = useTheme();
  const show = refreshing || loading || pull > 0;

  if (!show) return <div style={{ height: 0, flexShrink: 0 }} />;

  return (
    <div style={{
      height: pull || (refreshing || loading ? 46 : 0),
      transition: pull ? 'none' : 'height 0.25s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {refreshing || loading ? (
        <svg width="26" height="26" viewBox="0 0 26 26" style={{ animation: 'om-spin 0.8s linear infinite' }}>
          <circle cx="13" cy="13" r="10" stroke={C.divider} strokeWidth="3" fill="none" />
          <path d="M13 3a10 10 0 019.5 6.9" stroke={C.blue} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ transform: `rotate(${Math.min(180, pull * 2.4)}deg)`, opacity: Math.min(1, pull / 40) }}>
          <path d="M11 3v13M5.5 10.5L11 16l5.5-5.5" stroke={C.pullRefreshStroke} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
