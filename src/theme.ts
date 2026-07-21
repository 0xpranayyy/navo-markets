export {
  C,
  ThemeProvider,
  useTheme,
} from './theme/ThemeProvider';

export {
  cardStyle,
  darkColors,
  getColors,
  glassBlurStyle,
  glassShineStyle,
  lightColors,
  resolveSystemTheme,
  resolveTheme,
  sectionLabelStyle,
  sheetStyle,
  type ResolvedTheme,
  type ThemeColors,
  type ThemePreference,
} from './theme/palettes';

export {
  navoBrand,
} from './theme/brand';

export const formatVolume = (n: number): string => {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n;
};

export const formatCash = (n: number): string =>
  '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
