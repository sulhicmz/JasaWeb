/**
 * Design Tokens for JasaWeb
 * Centralized design system values for consistent UI/UX
 */

// Color Palette
export const COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Info Colors
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Info sky
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Neutral Colors (Dark Theme)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
} as const;

// Semantic Color Mapping
export const SEMANTIC_COLORS = {
  // Background Colors
  background: {
    primary: COLORS.neutral[950], // Main background (dark)
    secondary: COLORS.neutral[900], // Card backgrounds
    tertiary: COLORS.neutral[800], // Hover states
    accent: COLORS.primary[900], // Accent backgrounds
  },

  // Text Colors
  text: {
    primary: COLORS.neutral[50], // Main text
    secondary: COLORS.neutral[400], // Secondary text
    tertiary: COLORS.neutral[500], // Muted text
    inverse: COLORS.neutral[950], // Text on light backgrounds
    accent: COLORS.primary[400], // Accent text
  },

  // Border Colors
  border: {
    primary: COLORS.neutral[800], // Main borders
    secondary: COLORS.neutral[700], // Subtle borders
    accent: COLORS.primary[600], // Accent borders
    focus: COLORS.primary[500], // Focus rings
  },

  // Status Colors
  status: {
    success: COLORS.success[500],
    warning: COLORS.warning[500],
    error: COLORS.error[500],
    info: COLORS.info[500],
  },

  // Interactive States
  interactive: {
    hover: COLORS.neutral[700],
    active: COLORS.neutral[600],
    disabled: COLORS.neutral[800],
    selected: COLORS.primary[600],
  },
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    serif: ['Georgia', 'serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },

  // Font Sizes (rem units)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Spacing Scale
export const SPACING = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
} as const;

// Border Radius
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Shadows
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Custom shadows for specific use cases
  glow: {
    primary: '0 0 20px rgb(59 130 246 / 0.5)',
    success: '0 0 20px rgb(34 197 94 / 0.5)',
    warning: '0 0 20px rgb(245 158 11 / 0.5)',
    error: '0 0 20px rgb(239 68 68 / 0.5)',
  },
} as const;

// Breakpoints
export const BREAKPOINTS = {
  sm: '640px', // Small screens
  md: '768px', // Medium screens
  lg: '1024px', // Large screens
  xl: '1280px', // Extra large screens
  '2xl': '1536px', // 2X large screens
} as const;

// Animation Durations
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '1000ms',
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Z-Index Scale
export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Chart Colors (for data visualization)
export const CHART_COLORS = {
  default: [
    COLORS.primary[500],
    COLORS.success[500],
    COLORS.warning[500],
    COLORS.error[500],
    COLORS.info[500],
    COLORS.secondary[500],
  ],

  categorical: [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
  ],

  sequential: {
    low: COLORS.success[500],
    medium: COLORS.warning[500],
    high: COLORS.error[500],
  },
} as const;

// Component-specific tokens
export const COMPONENTS = {
  button: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
    padding: {
      sm: `${SPACING[3]} ${SPACING[4]}`,
      md: `${SPACING[4]} ${SPACING[6]}`,
      lg: `${SPACING[5]} ${SPACING[8]}`,
    },
  },

  input: {
    height: '2.5rem', // 40px
    padding: `${SPACING[3]} ${SPACING[4]}`,
  },

  card: {
    padding: SPACING[6],
    borderRadius: BORDER_RADIUS.lg,
    shadow: SHADOWS.lg,
  },

  modal: {
    padding: SPACING[8],
    borderRadius: BORDER_RADIUS.xl,
    maxWidth: '32rem',
  },
} as const;

// Export utility functions
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = COLORS;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) break;
  }

  return value || '';
};

export const getSpacing = (key: keyof typeof SPACING): string => {
  return SPACING[key];
};

export const getFontSize = (key: keyof typeof TYPOGRAPHY.fontSize): string => {
  return TYPOGRAPHY.fontSize[key];
};

// Type exports
export type ColorKey = keyof typeof COLORS;
export type SpacingKey = keyof typeof SPACING;
export type FontSizeKey = keyof typeof TYPOGRAPHY.fontSize;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
export type ShadowKey = keyof typeof SHADOWS;
