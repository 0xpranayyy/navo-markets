import type { CSSProperties } from 'react';
import type { ThemeColors } from './palettes';

/**
 * Apple HIG / SF Pro text styles (pt ≈ px at 1×).
 * @see https://developer.apple.com/design/human-interface-guidelines/typography
 */
export const iosType = {
  largeTitle: { fontSize: 34, fontWeight: 700, letterSpacing: 0.37, lineHeight: 41 / 34 } satisfies CSSProperties,
  title1: { fontSize: 28, fontWeight: 700, letterSpacing: 0.36, lineHeight: 34 / 28 } satisfies CSSProperties,
  title2: { fontSize: 22, fontWeight: 700, letterSpacing: 0.35, lineHeight: 28 / 22 } satisfies CSSProperties,
  title3: { fontSize: 20, fontWeight: 600, letterSpacing: 0.38, lineHeight: 25 / 20 } satisfies CSSProperties,
  headline: { fontSize: 17, fontWeight: 600, letterSpacing: -0.41, lineHeight: 22 / 17 } satisfies CSSProperties,
  body: { fontSize: 17, fontWeight: 400, letterSpacing: -0.41, lineHeight: 22 / 17 } satisfies CSSProperties,
  callout: { fontSize: 16, fontWeight: 400, letterSpacing: -0.32, lineHeight: 21 / 16 } satisfies CSSProperties,
  subheadline: { fontSize: 15, fontWeight: 400, letterSpacing: -0.24, lineHeight: 20 / 15 } satisfies CSSProperties,
  footnote: { fontSize: 13, fontWeight: 400, letterSpacing: -0.08, lineHeight: 18 / 13 } satisfies CSSProperties,
  caption1: { fontSize: 12, fontWeight: 400, letterSpacing: 0, lineHeight: 16 / 12 } satisfies CSSProperties,
  caption2: { fontSize: 11, fontWeight: 400, letterSpacing: 0.07, lineHeight: 13 / 11 } satisfies CSSProperties,
  tabLabel: { fontSize: 10, fontWeight: 500, letterSpacing: 0.07, lineHeight: 12 / 10 } satisfies CSSProperties,
} as const;

/** Layout constants from HIG (8pt grid, 44pt hit targets, 16–20pt margins). */
export const iosLayout = {
  screenMargin: 16,
  groupedMargin: 16,
  groupedRadius: 10,
  cardRadius: 12,
  sheetRadius: 28,
  minTouch: 44,
  searchHeight: 36,
  tabBarHeight: 49,
  rowMinHeight: 44,
  space1: 8,
  space2: 16,
  space3: 24,
} as const;

export function sectionHeaderStyle(c: ThemeColors): CSSProperties {
  return {
    ...iosType.footnote,
    fontWeight: 400,
    color: c.faint,
    textTransform: 'uppercase',
    letterSpacing: -0.08,
    margin: '0 4px 7px',
  };
}

export function groupedListStyle(c: ThemeColors): CSSProperties {
  return {
    background: c.groupedSurface,
    borderRadius: iosLayout.groupedRadius,
    overflow: 'hidden',
  };
}
