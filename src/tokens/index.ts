/**
 * Design tokens as TypeScript constants.
 * Use these in component JS (e.g. motion variants, inline styles)
 * instead of duplicating raw values.
 *
 * CSS components should reference the `var(--…)` custom properties instead;
 * these constants are for the JS layer only.
 */

// ── Brand colors ──────────────────────────────────────────────
export const colors = {
  brand: {
    cardinal:      '#C8102E',
    cardinalHover: '#A60C26',
    cardinalLight: '#FEF2F2',
    gold:          '#F1BE48',
    goldHover:     '#E0AC30',
    dark:          '#1F1F1F',
  },
  neutral: {
    white: '#FFFFFF',
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  semantic: {
    error:        '#EF4444',
    errorLight:   '#FEF2F2',
    success:      '#22C55E',
    successLight: '#F0FDF4',
    warning:      '#F59E0B',
    warningLight: '#FFFBEB',
    info:         '#3B82F6',
    infoLight:    '#EFF6FF',
  },
} as const;

// ── Typography ────────────────────────────────────────────────
export const fontFamily = {
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
  serif: "'Merriweather', Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const fontSize = {
  '2xs':  '0.625rem',
  xs:     '0.6875rem',
  sm:     '0.8125rem',
  base:   '0.875rem',
  md:     '1rem',
  lg:     '1.25rem',
  xl:     '1.5rem',
  '2xl':  '1.75rem',
} as const;

// ── Radius ────────────────────────────────────────────────────
export const radius = {
  sm:   '0.375rem',
  md:   '0.5rem',
  lg:   '0.75rem',
  xl:   '1rem',
  '2xl': '1.25rem',
  full: '9999px',
} as const;

// ── Shadows ───────────────────────────────────────────────────
export const shadow = {
  sm:       '0 1px 2px rgba(0,0,0,0.05)',
  card:     '0 8px 30px rgba(0,0,0,0.04)',
  lg:       '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  dropdown: '0 4px 24px rgba(0,0,0,0.12)',
} as const;

// ── Motion ────────────────────────────────────────────────────
export const duration = {
  fast:   0.15,
  normal: 0.2,
  slow:   0.4,
  slower: 0.5,
} as const;

export const easing = {
  default: [0.4, 0, 0.2, 1]   as const,
  out:     [0, 0, 0.2, 1]     as const,
  spring:  [0.34, 1.56, 0.64, 1] as const,
} as const;

// ── Sizing ────────────────────────────────────────────────────
export const inputHeight = { sm: '2rem', md: '2.5rem', lg: '3rem' } as const;
export const cardMaxWidth = { sm: '440px', md: '520px', lg: '640px' } as const;
