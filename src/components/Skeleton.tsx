import { useTheme } from '../theme';

export function SkeletonBar({ width = '100%', height = 12, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
  const { colors: C } = useTheme();
  return (
    <div className="anim-skeleton" style={{ width, height, borderRadius: radius, background: C.inputBg }} />
  );
}

export function MarketCardSkeleton() {
  const { card } = useTheme();
  return (
    <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <SkeletonBar width={36} height={36} radius={10} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBar height={14} />
          <SkeletonBar width="60%" height={10} />
        </div>
        <SkeletonBar width={40} height={24} radius={6} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <SkeletonBar height={38} radius={10} />
        <SkeletonBar height={38} radius={10} />
      </div>
    </div>
  );
}

export function PortfolioSkeleton() {
  const { card } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, borderRadius: 20, padding: 20 }}>
        <SkeletonBar width="40%" height={10} />
        <div style={{ height: 10 }} />
        <SkeletonBar width="55%" height={28} />
        <div style={{ height: 8 }} />
        <SkeletonBar width="30%" height={14} />
      </div>
      {[0, 1].map((i) => (
        <div key={i} style={{ ...card, padding: 14, display: 'flex', gap: 10 }}>
          <SkeletonBar width={36} height={36} radius={10} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonBar height={14} />
            <SkeletonBar width="50%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
