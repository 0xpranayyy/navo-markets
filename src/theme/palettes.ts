import type { CSSProperties } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  bgDeep: string;
  surface: string;
  surface2: string;
  text: string;
  sub: string;
  faint: string;
  hair: string;
  green: string;
  greenBg: string;
  red: string;
  redBg: string;
  blue: string;
  blueBg: string;
  overlay: string;
  toastBg: string;
  toastBorder: string;
  toastText: string;
  toastSub: string;
  inputBg: string;
  inputPlaceholder: string;
  searchIcon: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarShine: string;
  tabActiveBg: string;
  tabInactive: string;
  divider: string;
  glassBg: string;
  glassButtonBg: string;
  cardShadow: string;
  sheetHandle: string;
  keyBg: string;
  keyActiveBg: string;
  progressTrack: string;
  starInactive: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  buyConfirmText: string;
  landingTitle: string;
  landingSub: string;
  landingAccent: string;
  pullRefreshStroke: string;
  categoryChipBg: string;
  categoryChipActiveBg: string;
  categoryChipText: string;
  categoryChipActiveText: string;
  closeButtonBg: string;
  closeButtonText: string;
  metaThemeColor: string;
  /** Liquid Glass sheet / panel fill */
  sheetBg: string;
  sheetBorder: string;
  ambientTop: string;
  ambientMid: string;
  ambientBottom: string;
  /** Inset grouped list surface (Settings-style) */
  groupedSurface: string;
  /** Screen / scroll background behind grouped content */
  groupedBackground: string;
}

export const darkColors: ThemeColors = {
  bg: '#000000',
  bgDeep: '#000000',
  surface: '#1C1E22',
  surface2: 'rgba(28,30,34,0.96)',
  text: '#F5F6F7',
  sub: '#8B93A7',
  faint: '#6B7280',
  hair: '#26282C',
  green: '#34C759',
  greenBg: 'rgba(52,199,89,0.14)',
  red: '#FF453A',
  redBg: 'rgba(255,69,58,0.14)',
  blue: '#0A84FF',
  blueBg: 'rgba(10,132,255,0.18)',
  overlay: 'rgba(0,0,0,0.48)',
  toastBg: 'rgba(36,38,44,0.72)',
  toastBorder: 'rgba(255,255,255,0.16)',
  toastText: '#FFFFFF',
  toastSub: 'rgba(255,255,255,0.68)',
  inputBg: 'rgba(255,255,255,0.08)',
  inputPlaceholder: 'rgba(235,235,245,0.38)',
  searchIcon: 'rgba(235,235,245,0.48)',
  tabBarBg: 'rgba(28,30,36,0.55)',
  tabBarBorder: 'rgba(255,255,255,0.18)',
  tabBarShine: 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -0.5px 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(255,255,255,0.04)',
  tabActiveBg: 'rgba(255,255,255,0.14)',
  tabInactive: 'rgba(235,235,245,0.42)',
  divider: 'rgba(255,255,255,0.08)',
  glassBg: 'rgba(255,255,255,0.08)',
  glassButtonBg: 'rgba(255,255,255,0.12)',
  cardShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 28px rgba(0,0,0,0.28)',
  sheetHandle: 'rgba(255,255,255,0.28)',
  keyBg: 'rgba(255,255,255,0.06)',
  keyActiveBg: 'rgba(255,255,255,0.14)',
  progressTrack: 'rgba(255,255,255,0.1)',
  starInactive: 'rgba(235,235,245,0.32)',
  primaryButtonBg: '#FFFFFF',
  primaryButtonText: '#000000',
  buyConfirmText: '#06231a',
  landingTitle: '#FFFFFF',
  landingSub: 'rgba(235,235,245,0.64)',
  landingAccent: '#4DA3FF',
  pullRefreshStroke: 'rgba(235,235,245,0.7)',
  categoryChipBg: 'rgba(255,255,255,0.08)',
  categoryChipActiveBg: 'rgba(10,132,255,0.2)',
  categoryChipText: 'rgba(235,235,245,0.72)',
  categoryChipActiveText: '#64B5FF',
  closeButtonBg: 'rgba(255,255,255,0.1)',
  closeButtonText: '#FFFFFF',
  metaThemeColor: '#000000',
  sheetBg: 'rgba(22,24,28,0.78)',
  sheetBorder: 'rgba(255,255,255,0.14)',
  ambientTop: 'rgba(10,132,255,0.22)',
  ambientMid: 'rgba(48,209,88,0.08)',
  ambientBottom: 'rgba(10,132,255,0.12)',
  groupedSurface: 'rgba(28,30,36,0.92)',
  groupedBackground: '#000000',
};

export const lightColors: ThemeColors = {
  bg: '#F4F5F7',
  bgDeep: '#F4F5F7',
  surface: 'rgba(255,255,255,0.72)',
  surface2: 'rgba(255,255,255,0.86)',
  text: '#1C1C1E',
  sub: '#8B93A7',
  faint: '#6B7280',
  hair: 'rgba(255,255,255,0.7)',
  green: '#34C759',
  greenBg: 'rgba(52,199,89,0.14)',
  red: '#FF453A',
  redBg: 'rgba(255,59,48,0.12)',
  blue: '#0A84FF',
  blueBg: 'rgba(0,122,255,0.14)',
  overlay: 'rgba(0,0,0,0.28)',
  toastBg: 'rgba(255,255,255,0.78)',
  toastBorder: 'rgba(255,255,255,0.9)',
  toastText: '#1C1C1E',
  toastSub: 'rgba(60,60,67,0.62)',
  inputBg: 'rgba(255,255,255,0.55)',
  inputPlaceholder: 'rgba(60,60,67,0.4)',
  searchIcon: 'rgba(60,60,67,0.45)',
  tabBarBg: 'rgba(255,255,255,0.62)',
  tabBarBorder: 'rgba(255,255,255,0.85)',
  tabBarShine: 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -0.5px 0 rgba(0,0,0,0.04), inset 1px 0 0 rgba(255,255,255,0.7), inset -1px 0 0 rgba(0,0,0,0.03)',
  tabActiveBg: 'rgba(0,122,255,0.12)',
  tabInactive: 'rgba(60,60,67,0.42)',
  divider: 'rgba(0,0,0,0.06)',
  glassBg: 'rgba(255,255,255,0.55)',
  glassButtonBg: 'rgba(255,255,255,0.7)',
  cardShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 24px rgba(0,0,0,0.06)',
  sheetHandle: 'rgba(60,60,67,0.22)',
  keyBg: 'rgba(255,255,255,0.55)',
  keyActiveBg: 'rgba(0,0,0,0.06)',
  progressTrack: 'rgba(0,0,0,0.06)',
  starInactive: 'rgba(60,60,67,0.28)',
  primaryButtonBg: '#1C1C1E',
  primaryButtonText: '#FFFFFF',
  buyConfirmText: '#FFFFFF',
  landingTitle: '#1C1C1E',
  landingSub: 'rgba(60,60,67,0.7)',
  landingAccent: '#0A6BE0',
  pullRefreshStroke: 'rgba(60,60,67,0.55)',
  categoryChipBg: 'rgba(255,255,255,0.55)',
  categoryChipActiveBg: 'rgba(0,122,255,0.14)',
  categoryChipText: 'rgba(60,60,67,0.72)',
  categoryChipActiveText: '#007AFF',
  closeButtonBg: 'rgba(255,255,255,0.7)',
  closeButtonText: '#1C1C1E',
  metaThemeColor: '#F4F5F7',
  sheetBg: 'rgba(255,255,255,0.78)',
  sheetBorder: 'rgba(255,255,255,0.95)',
  ambientTop: 'rgba(0,122,255,0.14)',
  ambientMid: 'rgba(52,199,89,0.08)',
  ambientBottom: 'rgba(0,122,255,0.1)',
  groupedSurface: '#FFFFFF',
  groupedBackground: '#F4F5F7',
};

/** Interactive surface — Liquid Glass card */
export function cardStyle(c: ThemeColors): CSSProperties {
  return {
    background: c.surface,
    borderRadius: 20,
    border: `0.5px solid ${c.hair}`,
    boxShadow: c.cardShadow,
    backdropFilter: 'blur(28px) saturate(160%)',
    WebkitBackdropFilter: 'blur(28px) saturate(160%)',
  };
}

export function sectionLabelStyle(c: ThemeColors): CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 600,
    color: c.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: '0 4px 8px',
  };
}

export function glassBlurStyle(c: ThemeColors): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    background: c.glassBg,
  };
}

export function glassShineStyle(c: ThemeColors, radius: number | string): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: radius,
    boxShadow: c.tabBarShine,
    border: `0.5px solid ${c.tabBarBorder}`,
    pointerEvents: 'none',
  };
}

/** Bottom sheet / floating panel Liquid Glass shell */
export function sheetStyle(c: ThemeColors): CSSProperties {
  return {
    background: c.sheetBg,
    backdropFilter: 'blur(48px) saturate(190%)',
    WebkitBackdropFilter: 'blur(48px) saturate(190%)',
    border: `0.5px solid ${c.sheetBorder}`,
    boxShadow: c.tabBarShine + ', 0 -24px 64px rgba(0,0,0,0.28)',
  };
}

export function resolveSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return resolveSystemTheme();
  return preference;
}

export function getColors(resolved: ResolvedTheme): ThemeColors {
  return resolved === 'dark' ? darkColors : lightColors;
}
