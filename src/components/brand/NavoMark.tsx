import type { CSSProperties } from 'react';
import { useTheme } from '../../theme';
import type { ResolvedTheme } from '../../theme/palettes';

export const brandTokens = {
  navoBlue: '#0A84FF',
  navoBlueDeep: '#0A4DB5',
  navoSky: '#4DA3FF',
  navoBlueLight: '#0A6BE0',
  bg: '#000000',
  surface: '#1C1E22',
  hairline: '#26282C',
  paper: '#F4F5F7',
  ink: '#0B0C0E',
  yes: '#34C759',
  no: '#FF453A',
  textSecondary: '#8B93A7',
  textTertiary: '#6B7280',
} as const;

export function markColors(resolved: ResolvedTheme) {
  return resolved === 'dark'
    ? { base: '#FFFFFF', accent: brandTokens.navoBlue }
    : { base: brandTokens.ink, accent: brandTokens.navoBlueLight };
}

/** Inline Navo mark — 4 shapes, themeable. Accent is always blue (never yes/no green/red). */
export function NavoMark({
  size = 32,
  base,
  accent,
  style,
}: {
  size?: number;
  base?: string;
  accent?: string;
  style?: CSSProperties;
}) {
  const { resolved } = useTheme();
  const colors = markColors(resolved);
  const fillBase = base ?? colors.base;
  const fillAccent = accent ?? colors.accent;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="Navo"
      role="img"
      style={style}
    >
      <rect x="18" y="24" width="15" height="58" fill={fillBase} />
      <polygon points="18,24 33,24 82,82 67,82" fill={fillBase} />
      <rect x="67" y="34" width="15" height="48" fill={fillAccent} />
      <polygon points="74.5,12 92,36 57,36" fill={fillAccent} />
    </svg>
  );
}

/** App header lockup — mark + uppercase NAVO in sky blue. */
export function NavoHeaderLockup({ markSize = 22 }: { markSize?: number }) {
  const sky = brandTokens.navoSky;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <NavoMark size={markSize} base={sky} accent={sky} />
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.24em',
        color: sky,
        lineHeight: 1,
      }}>
        NAVO
      </span>
    </div>
  );
}

/** Product / marketing lockup — mark + lowercase navo. */
export function NavoProductLockup({
  size = 64,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const { colors: C, resolved } = useTheme();
  const mc = markColors(resolved);
  const textColor = color ?? C.landingTitle;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.18) }}>
      <NavoMark size={size} base={mc.base} accent={mc.accent} />
      <span style={{
        fontSize: Math.round(size * 0.55),
        fontWeight: 800,
        letterSpacing: '-0.03em',
        color: textColor,
        lineHeight: 1,
      }}>
        navo
      </span>
    </div>
  );
}
