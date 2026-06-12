export interface Problem {
  id: string;
  latex: string;
  source: string;
}

export type Spacing = 'compact' | 'two-per-page' | 'three-per-page';
export type FontSize = 'small' | 'normal' | 'large';

export interface LayoutConfig {
  spacing: Spacing;
  numbering: boolean;
  fontSize: FontSize;
  columns: 1 | 2;
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  spacing: 'compact',
  numbering: true,
  fontSize: 'normal',
  columns: 1,
};

/** Gap between problems within a page (or flat list in compact mode) */
export const SPACING_MAP: Record<Spacing, number> = {
  compact: 20,
  'two-per-page': 52,
  'three-per-page': 36,
};

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '0.92rem',
  normal: '1.1rem',
  large: '1.35rem',
};
