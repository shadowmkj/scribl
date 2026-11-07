import { ThemeMode } from './themeManager';

export interface SwatchDefinition {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export const SWATCH_PALETTE: SwatchDefinition[] = [
  { id: 'primary', name: 'Primary Ink', light: '#000000', dark: '#ffffff' },
  { id: 'charcoal', name: 'Charcoal', light: '#64748b', dark: '#94a3b8' },
  { id: 'surface', name: 'Surface / White', light: '#ffffff', dark: '#1e293b' },
  { id: 'blue', name: 'Sky Blue', light: '#0284c7', dark: '#0284c7' },
  { id: 'red', name: 'Coral Red', light: '#e11d48', dark: '#e11d48' },
  { id: 'green', name: 'Emerald', light: '#059669', dark: '#059669' },
  { id: 'amber', name: 'Amber', light: '#d97706', dark: '#d97706' },
  { id: 'violet', name: 'Violet', light: '#7c3aed', dark: '#7c3aed' },
];

export function resolveThemeColor(color: string, mode: ThemeMode): string {
  if (!color || color === 'transparent') return color;

  const clean = color.trim().toLowerCase();

  // 1. Direct match by Swatch ID
  const swatchById = SWATCH_PALETTE.find((s) => s.id === clean);
  if (swatchById) {
    return swatchById[mode];
  }

  // 2. Black & White adaptive mapping
  const isBlack = clean === '#000000'
    || clean === '#000'
    || clean === '#1e293b'
    || clean === '#0f172a'
    || clean === 'black'
    || clean === 'currentcolor'
    || clean === 'adaptive';

  if (isBlack) {
    return mode === 'dark' ? '#ffffff' : '#000000';
  }

  const isWhite = clean === '#ffffff'
    || clean === '#fff'
    || clean === 'white';

  if (isWhite) {
    return mode === 'dark' ? '#ffffff' : '#000000';
  }

  // 3. Custom hex or accent colors remain unchanged
  return color;
}
