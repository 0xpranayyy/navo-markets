import { useTheme } from '../theme';

interface Props {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorState({ title, message, onRetry, retryLabel = 'Try again' }: Props) {
  const { colors: C, card } = useTheme();

  return (
    <div style={{ ...card, borderRadius: 16, padding: 28, textAlign: 'center', margin: '20px 0' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: C.faint, lineHeight: 1.5, marginBottom: onRetry ? 16 : 0 }}>{message}</div>
      {onRetry && (
        <div className="pressable" onClick={onRetry}
          style={{ display: 'inline-block', background: C.blue, color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '10px 20px' }}>
          {retryLabel}
        </div>
      )}
    </div>
  );
}
