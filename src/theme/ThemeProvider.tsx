import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  cardStyle,
  darkColors,
  getColors,
  glassBlurStyle,
  glassShineStyle,
  resolveSystemTheme,
  resolveTheme,
  sectionLabelStyle,
  sheetStyle,
  type ResolvedTheme,
  type ThemeColors,
  type ThemePreference,
} from './palettes';

const THEME_KEY = 'navo-theme';

function loadPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  } catch {
    // ignore
  }
  return 'system';
}

function savePreference(preference: ThemePreference) {
  localStorage.setItem(THEME_KEY, preference);
}

function applyDocumentTheme(resolved: ResolvedTheme, colors: ThemeColors) {
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
  document.body.style.background = colors.groupedBackground;
  document.body.style.color = colors.text;

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const media = meta.getAttribute('media') ?? '';
    if (media.includes('dark')) meta.setAttribute('content', '#000000');
    else if (media.includes('light')) meta.setAttribute('content', '#F4F5F7');
    else meta.setAttribute('content', colors.metaThemeColor);
  });
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  colors: ThemeColors;
  setPreference: (preference: ThemePreference) => void;
  card: CSSProperties;
  sheet: CSSProperties;
  sectionLabel: CSSProperties;
  glassBlur: CSSProperties;
  glassShine: (radius: number | string) => CSSProperties;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => loadPreference());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => resolveSystemTheme());

  const resolved = useMemo(() => resolveTheme(preference === 'system' ? 'system' : preference), [preference, systemTheme]);
  const colors = useMemo(() => getColors(resolved), [resolved]);

  useEffect(() => {
    applyDocumentTheme(resolved, colors);
  }, [resolved, colors]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setPreference = (next: ThemePreference) => {
    savePreference(next);
    setPreferenceState(next);
  };

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    resolved,
    colors,
    setPreference,
    card: cardStyle(colors),
    sheet: sheetStyle(colors),
    sectionLabel: sectionLabelStyle(colors),
    glassBlur: glassBlurStyle(colors),
    glassShine: (radius: number | string) => glassShineStyle(colors, radius),
  }), [preference, resolved, colors]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Static dark palette for non-React modules */
export const C = darkColors;
