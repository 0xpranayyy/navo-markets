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
  surface: '#1C1C1E',
  surface2: 'rgba(28,28,30,0.96)',
  text: '#FFFFFF',
  sub: 'rgba(235,235,245,0.6)',
  faint: 'rgba(235,235,245,0.3)',
  hair: 'rgba(84,84,88,0.65)',
  green: '#30D158',
  greenBg: 'rgba(48,209,88,0.16)',
  red: '#FF453A',
  redBg: 'rgba(255,69,58,0.16)',
  blue: '#0A84FF',
  blueBg: 'rgba(10,132,255,0.18)',
  overlay: 'rgba(0,0,0,0.52)',
  toastBg: 'rgba(44,44,46,0.82)',
  toastBorder: 'rgba(84,84,88,0.65)',
  toastText: '#FFFFFF',
  toastSub: 'rgba(235,235,245,0.6)',
  inputBg: 'rgba(118,118,128,0.24)',
  inputPlaceholder: 'rgba(235,235,245,0.3)',
  searchIcon: 'rgba(235,235,245,0.4)',
  tabBarBg: 'rgba(22,22,24,0.78)',
  tabBarBorder: 'rgba(84,84,88,0.65)',
  tabBarShine: 'inset 0 0.5px 0 rgba(255,255,255,0.12)',
  tabActiveBg: 'transparent',
  tabInactive: 'rgba(235,235,245,0.4)',
  divider: 'rgba(84,84,88,0.65)',
  glassBg: 'rgba(44,44,46,0.72)',
  glassButtonBg: 'rgba(118,118,128,0.24)',
  cardShadow: 'none',
  sheetHandle: 'rgba(235,235,245,0.3)',
  keyBg: 'rgba(118,118,128,0.24)',
  keyActiveBg: 'rgba(118,118,128,0.36)',
  progressTrack: 'rgba(118,118,128,0.24)',
  starInactive: 'rgba(235,235,245,0.3)',
  primaryButtonBg: '#FFFFFF',
  primaryButtonText: '#000000',
  buyConfirmText: '#003D1F',
  landingTitle: '#FFFFFF',
  landingSub: 'rgba(235,235,245,0.6)',
  landingAccent: '#64D2FF',
  pullRefreshStroke: 'rgba(235,235,245,0.6)',
  categoryChipBg: 'rgba(118,118,128,0.24)',
  categoryChipActiveBg: 'rgba(10,132,255,0.22)',
  categoryChipText: 'rgba(235,235,245,0.6)',
  categoryChipActiveText: '#0A84FF',
  closeButtonBg: 'rgba(118,118,128,0.24)',
  closeButtonText: '#FFFFFF',
  metaThemeColor: '#000000',
  sheetBg: 'rgba(28,28,30,0.92)',
  sheetBorder: 'rgba(84,84,88,0.65)',
  ambientTop: 'rgba(10,132,255,0.14)',
  ambientMid: 'rgba(48,209,88,0.05)',
  ambientBottom: 'rgba(10,132,255,0.08)',
  groupedSurface: '#1C1C1E',
  groupedBackground: '#000000',
};

export const lightColors: ThemeColors = {
  bg: '#F2F2F7',
  bgDeep: '#F2F2F7',
  surface: '#FFFFFF',
  surface2: '#FFFFFF',
  text: '#000000',
  sub: 'rgba(60,60,67,0.6)',
  faint: 'rgba(60,60,67,0.3)',
  hair: 'rgba(60,60,67,0.29)',
  green: '#34C759',
  greenBg: 'rgba(52,199,89,0.14)',
  red: '#FF3B30',
  redBg: 'rgba(255,59,48,0.12)',
  blue: '#007AFF',
  blueBg: 'rgba(0,122,255,0.12)',
  overlay: 'rgba(0,0,0,0.32)',
  toastBg: 'rgba(255,255,255,0.92)',
  toastBorder: 'rgba(60,60,67,0.18)',
  toastText: '#000000',
  toastSub: 'rgba(60,60,67,0.6)',
  inputBg: 'rgba(118,118,128,0.12)',
  inputPlaceholder: 'rgba(60,60,67,0.3)',
  searchIcon: 'rgba(60,60,67,0.4)',
  tabBarBg: 'rgba(249,249,249,0.82)',
  tabBarBorder: 'rgba(60,60,67,0.29)',
  tabBarShine: 'none',
  tabActiveBg: 'transparent',
  tabInactive: 'rgba(60,60,67,0.4)',
  divider: 'rgba(60,60,67,0.29)',
  glassBg: 'rgba(255,255,255,0.72)',
  glassButtonBg: 'rgba(118,118,128,0.12)',
  cardShadow: 'none',
  sheetHandle: 'rgba(60,60,67,0.3)',
  keyBg: 'rgba(118,118,128,0.12)',
  keyActiveBg: 'rgba(118,118,128,0.2)',
  progressTrack: 'rgba(118,118,128,0.16)',
  starInactive: 'rgba(60,60,67,0.3)',
  primaryButtonBg: '#007AFF',
  primaryButtonText: '#FFFFFF',
  buyConfirmText: '#FFFFFF',
  landingTitle: '#000000',
  landingSub: 'rgba(60,60,67,0.6)',
  landingAccent: '#007AFF',
  pullRefreshStroke: 'rgba(60,60,67,0.45)',
  categoryChipBg: 'rgba(118,118,128,0.12)',
  categoryChipActiveBg: 'rgba(0,122,255,0.12)',
  categoryChipText: 'rgba(60,60,67,0.6)',
  categoryChipActiveText: '#007AFF',
  closeButtonBg: 'rgba(118,118,128,0.12)',
  closeButtonText: '#000000',
  metaThemeColor: '#F2F2F7',
  sheetBg: 'rgba(255,255,255,0.94)',
  sheetBorder: 'rgba(60,60,67,0.18)',
  ambientTop: 'rgba(0,122,255,0.08)',
  ambientMid: 'rgba(52,199,89,0.04)',
  ambientBottom: 'rgba(0,122,255,0.06)',
  groupedSurface: '#FFFFFF',
  groupedBackground: '#F2F2F7',
};

/** Interactive surface — inset grouped card (HIG) */
export function cardStyle(c: ThemeColors): CSSProperties {
  return {
    background: c.groupedSurface,
    borderRadius: 12,
    border: `0.33px solid ${c.divider}`,
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

/** Bottom sheet / floating panel — system material */
export function sheetStyle(c: ThemeColors): CSSProperties {
  return {
    background: c.sheetBg,
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: `0.33px solid ${c.sheetBorder}`,
    boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
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
