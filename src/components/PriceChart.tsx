import { useTheme } from '../theme';

interface Props {
  trend: number[];
  color: string;
  width?: number;
  height?: number;
}

export default function PriceChart({ trend, color, width = 340, height = 130 }: Props) {
  const { colors: C, resolved } = useTheme();

  if (trend.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.faint, fontSize: 13 }}>
        {trend.length ? 'Not enough history' : 'Loading price history…'}
      </div>
    );
  }

  const pad = 8;
  const n = trend.length;
  const pts = trend.map((v, i) => [(i / (n - 1)) * width, height - pad - (v / 100) * (height - 2 * pad)]);
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const fill =
    color === C.red
      ? (resolved === 'dark' ? 'rgba(255,77,103,0.1)' : 'rgba(215,0,21,0.08)')
      : color === C.green
        ? (resolved === 'dark' ? 'rgba(23,199,131,0.1)' : 'rgba(36,138,61,0.08)')
        : (resolved === 'dark' ? 'rgba(10,132,255,0.08)' : 'rgba(0,122,255,0.08)');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={area} fill={fill} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
