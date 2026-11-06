import { describe, expect, it } from 'vitest';
import { FONT_FAMILIES, getFontFamilyId, getFontFamilyString } from './fontConstants';

describe('fontConstants', () => {
  it('defines 3 default font families', () => {
    expect(FONT_FAMILIES).toHaveLength(3);
    expect(FONT_FAMILIES.map((f) => f.id)).toEqual(['handwritten', 'normal', 'code']);
    expect(FONT_FAMILIES[0].label).toBe('Hand-Written');
    expect(FONT_FAMILIES[0].family).toContain('Excalifont');
    expect(FONT_FAMILIES[1].label).toBe('Normal');
    expect(FONT_FAMILIES[2].label).toBe('Code');
    expect(FONT_FAMILIES[2].family).toContain('monospace');
  });

  it('getFontFamilyString resolves IDs and custom strings correctly', () => {
    expect(getFontFamilyString('handwritten')).toContain('Excalifont');
    expect(getFontFamilyString('normal')).toContain('system-ui');
    expect(getFontFamilyString('code')).toContain('monospace');
    expect(getFontFamilyString(undefined)).toContain('Excalifont');
    expect(getFontFamilyString('CustomFont, sans-serif')).toBe('CustomFont, sans-serif');
  });

  it('getFontFamilyId resolves font strings and IDs to FontFamilyId', () => {
    expect(getFontFamilyId('handwritten')).toBe('handwritten');
    expect(getFontFamilyId('normal')).toBe('normal');
    expect(getFontFamilyId('code')).toBe('code');
    expect(getFontFamilyId('Excalifont, cursive, sans-serif')).toBe('handwritten');
    expect(getFontFamilyId(undefined)).toBe('handwritten');
    expect(getFontFamilyId('Unknown Font')).toBe('normal');
  });
});
