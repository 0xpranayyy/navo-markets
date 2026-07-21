export function BackgroundOrbs({ resolved }: { resolved: 'dark' | 'light' }) {
  const orb = (style: React.CSSProperties, rgb: string, a: number) => (
    <div style={{
      position: 'absolute',
      borderRadius: 9999,
      background: `radial-gradient(circle closest-side, rgba(${rgb},${a}), rgba(${rgb},0))`,
      pointerEvents: 'none',
      ...style,
    }} />
  );

  return (
    <>
      {orb({ top: -80, left: -60, width: 320, height: 320 }, '10,132,255', resolved === 'dark' ? 0.55 : 0.35)}
      {orb({ top: 180, right: -100, width: 340, height: 340 }, '48,209,88', resolved === 'dark' ? 0.22 : 0.16)}
      {orb({ bottom: -70, left: 30, width: 300, height: 300 }, '100,181,255', resolved === 'dark' ? 0.28 : 0.18)}
    </>
  );
}

export const FEATURE_PILLS = ['Politics', 'Sports', 'Crypto', 'Culture'] as const;

export function FeaturePills({
  faint,
  chipBg,
  align = 'center',
}: {
  faint: string;
  chipBg: string;
  align?: 'start' | 'center';
}) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: align === 'start' ? 'flex-start' : 'center',
    }}>
      {FEATURE_PILLS.map((label) => (
        <div key={label} style={{
          padding: '6px 12px',
          borderRadius: 9999,
          background: chipBg,
          fontSize: 12,
          fontWeight: 700,
          color: faint,
          letterSpacing: 0.2,
        }}>
          {label}
        </div>
      ))}
    </div>
  );
}
