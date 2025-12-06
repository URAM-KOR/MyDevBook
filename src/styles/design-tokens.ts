/**
 * Design Contract에 기반한 디자인 토큰
 * 참고: _docs/7.Design Contract.md
 */

// Spacing System
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  section: '56px',
} as const;

// Grid
export const grid = {
  gap: spacing.lg, // 24px
  columns: {
    default: 4,
    lg: 3,
    sm: 2,
    xs: 1,
  },
} as const;

// Card
export const card = {
  minWidth: '240px',
  minHeight: '280px',
  borderRadius: '16px',
  padding: '20px',
  imageHeight: '160px',
} as const;

// Typography
export const typography = {
  title: {
    size: '18px',
    weight: 600,
  },
  description: {
    size: '14px',
    maxLines: 2,
  },
} as const;

// Colors
export const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
} as const;

// Shadow
export const shadows = {
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

// Transition
export const transition = {
  duration: '200ms',
  timing: 'ease-in-out',
} as const;

// Container
export const container = {
  maxWidth: '1280px',
  padding: spacing.xl, // 32px
} as const;

// Button
export const button = {
  borderRadius: '8px',
  gap: spacing.sm, // 8px
} as const;

// 공통 스타일 조합
export const cardStyles = {
  base: {
    minWidth: card.minWidth,
    borderRadius: card.borderRadius,
    boxShadow: shadows.md,
    transition: `all ${transition.duration} ${transition.timing}`,
  },
  hover: {
    boxShadow: shadows.lg,
  },
} as const;

