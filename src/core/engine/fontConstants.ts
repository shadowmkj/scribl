export type FontFamilyId = 'handwritten' | 'normal' | 'code';

export interface FontFamilyOption {
  id: FontFamilyId;
  label: string;
  family: string;
}

export const FONT_FAMILIES: FontFamilyOption[] = [
  {
    id: 'handwritten',
    label: 'Hand-Written',
    family: 'Excalifont, cursive, sans-serif',
  },
  {
    id: 'normal',
    label: 'Normal',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: 'code',
    label: 'Code',
    family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
];

export function getFontFamilyString(familyOrId?: string): string {
  if (!familyOrId) return FONT_FAMILIES[0].family;
  const match = FONT_FAMILIES.find((f) => f.id === familyOrId || f.family === familyOrId);
  return match ? match.family : familyOrId;
}

export function getFontFamilyId(familyOrId?: string): FontFamilyId {
  if (!familyOrId) return 'handwritten';
  const match = FONT_FAMILIES.find((f) => f.id === familyOrId || f.family === familyOrId);
  return match ? match.id : 'normal';
}
