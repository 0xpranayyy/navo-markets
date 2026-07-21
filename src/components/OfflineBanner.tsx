import { useOnline } from '../hooks/useOnline';
import { useTheme } from '../theme';

export default function OfflineBanner() {
  const online = useOnline();
  const { colors: C } = useTheme();

  if (online) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(env(safe-area-inset-top, 0px) + 4px)',
      left: 12,
      right: 12,
      zIndex: 500,
      background: C.red,
      color: '#fff',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 13,
      fontWeight: 600,
      textAlign: 'center',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    }}>
      You're offline — some features may not work
    </div>
  );
}
