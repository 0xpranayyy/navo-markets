import type { CSSProperties } from 'react';
import type { ThemeColors } from './palettes';

/** Apple HIG type scale (SF Pro). Sizes in px ≈ pt at 1×. */
export const iosType = {
  largeTitle: { fontSize: 34, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.05 } satisfies CSSProperties,
  title1: { fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.12 } satisfies CSSProperties,
  title2: { fontSize: 22, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.18 } satisfies CSSProperties,
  title3: { fontSize: 20, fontWeight: 600, letterSpacing: -0.35, lineHeight: 1.2 } satisfies CSSProperties,
  headline: { fontSize: 17, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.24 } satisfies CSSProperties,
  body: { fontSize: 17, fontWeight: 400, letterSpacing: -0.2, lineHeight: 1.29 } satisfies CSSProperties,
  callout: { fontSize: 16, fontWeight: 400, letterSpacing: -0.15, lineHeight: 1.31 } satisfies CSSProperties,
  subheadline: { fontSize: 15, fontWeight: 400, letterSpacing: -0.1, lineHeight: 1.33 } satisfies CSSProperties,
  footnote: { fontSize: 13, fontWeight: 400, letterSpacing: 0, lineHeight: 1.34 } satisfies CSSProperties,
  caption1: { fontSize: 12, fontWeight: 400, letterSpacing: 0, lineHeight: 1.33 } satisfies CSSProperties,
  caption2: { fontSize: 11, fontWeight: 400, letterSpacing: 0.06, lineHeight: 1.27 } satisfies CSSProperties,
  tabLabel: { fontSize: 10, fontWeight: 500, letterSpacing: 0.06, lineHeight: 1.2 } satisfies CSSProperties,
} as const;

export const iosLayout = {
  screenMargin: 20,
  groupedMargin: 20,
  groupedRadius: 10,
  cardRadius: 12,
  sheetRadius: 38,
  minTouch: 44,
  searchHeight: 36,
  tabBarHeight: 49,
} as const;

export function sectionHeaderStyle(c: ThemeColors): CSSProperties {
  return {
    ...iosType.footnote,
    fontWeight: 600,
    color: c.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: '0 4px 8px',
  };
}

export function groupedListStyle(c: ThemeColors): CSSProperties {
  return {
    background: c.groupedSurface,
    borderRadius: iosLayout.groupedRadius,
    overflow: 'hidden',
    border: `0.33px solid ${c.divider}`,
  };
}
