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

/*
 * ORDINENS OWNER THEME — ORANGE + WHITE
 *
 * A clean, modern, professional palette. Always light:
 * no dark mode is used anywhere in the Owner Panel.
 */
export const LightColors: ColorPalette = {
  brand: '#f97316',
  brandDark: '#ea580c',
  accent: '#fb923c',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0ea5e9',
  background: '#fff8f2',
  surface: '#ffffff',
  surface2: '#fff1e6',
  border: '#f0ddd0',
  text: '#1c1917',
  textMuted: '#57534e',
  textFaint: '#a8a29e',
  overlay: 'rgba(28,25,23,0.55)',
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
  // The Owner Panel always uses the light Orange + White theme.
  // Dark mode is not supported.
  const colors = LightColors;
  const isDark = false;
  return { colors, isDark, spacing, radius, typography };
}

export type Theme = ReturnType<typeof useTheme>;