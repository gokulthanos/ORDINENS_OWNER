import { useColorScheme } from 'react-native';

export interface ColorPalette {
  brand: string;
  brandDark: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  overlay: string;
  white: string;
}

export const LightColors: ColorPalette = {
  brand: '#6d4dff',
  brandDark: '#5b3de0',
  accent: '#ec4899',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0ea5e9',
  background: '#f4f5fb',
  surface: '#ffffff',
  surface2: '#f0f1fb',
  border: '#e0e2f0',
  text: '#16182c',
  textMuted: '#5b5f7e',
  textFaint: '#8b8fae',
  overlay: 'rgba(11,12,20,0.55)',
  white: '#ffffff',
};

export const DarkColors: ColorPalette = {
  brand: '#7c5cff',
  brandDark: '#a855f7',
  accent: '#ec4899',
  success: '#22c55e',
  warning: '#f5b201',
  danger: '#ef4444',
  info: '#38b6ff',
  background: '#0b0c14',
  surface: '#171927',
  surface2: '#1e2033',
  border: '#2a2d45',
  text: '#eef0ff',
  textMuted: '#9aa0c4',
  textFaint: '#6a6f93',
  overlay: 'rgba(0,0,0,0.6)',
  white: '#ffffff',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: 'bold' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: 'bold' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  price: { fontSize: 16, fontWeight: '700' as const },
} as const;

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;
  return { colors, isDark, spacing, radius, typography };
}

export type Theme = ReturnType<typeof useTheme>;