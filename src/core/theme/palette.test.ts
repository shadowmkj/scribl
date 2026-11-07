import { describe, expect, it } from 'vitest';
import { resolveThemeColor, SWATCH_PALETTE } from './palette';

describe('palette and resolveThemeColor (tldraw-style semantic palette)', () => {
  it('defines semantic swatches with light and dark mode colors', () => {
    expect(SWATCH_PALETTE.length).toBe(8);
    const primary = SWATCH_PALETTE.find((s) => s.id === 'primary');
    expect(primary).toBeDefined();
    expect(primary?.light).toBe('#000000');
    expect(primary?.dark).toBe('#ffffff');

    const blue = SWATCH_PALETTE.find((s) => s.id === 'blue');
    expect(blue?.light).toBe('#0284c7');
    expect(blue?.dark).toBe('#0284c7');
  });

  it('resolves primary ink between black and white based on active theme mode', () => {
    expect(resolveThemeColor('primary', 'light')).toBe('#000000');
    expect(resolveThemeColor('primary', 'dark')).toBe('#ffffff');
  });

  it('maps legacy black and white hexes to adaptive ink', () => {
    // Black notes drawn in light mode flip to white in dark mode
    expect(resolveThemeColor('#000000', 'dark')).toBe('#ffffff');
    expect(resolveThemeColor('#000', 'dark')).toBe('#ffffff');
    expect(resolveThemeColor('#1e293b', 'dark')).toBe('#ffffff');
    expect(resolveThemeColor('#0f172a', 'dark')).toBe('#ffffff');

    // White notes drawn in dark mode flip to black in light mode
    expect(resolveThemeColor('#ffffff', 'light')).toBe('#000000');
    expect(resolveThemeColor('#fff', 'light')).toBe('#000000');

    // Preserves in-mode contrast
    expect(resolveThemeColor('#000000', 'light')).toBe('#000000');
    expect(resolveThemeColor('#ffffff', 'dark')).toBe('#ffffff');
  });

  it('preserves accent colors unchanged across dark and light modes', () => {
    expect(resolveThemeColor('#0284c7', 'dark')).toBe('#0284c7');
    expect(resolveThemeColor('#0284c7', 'light')).toBe('#0284c7');
    expect(resolveThemeColor('#e11d48', 'dark')).toBe('#e11d48');
    expect(resolveThemeColor('#e11d48', 'light')).toBe('#e11d48');
  });

  it('preserves transparent and arbitrary custom hex colors', () => {
    expect(resolveThemeColor('transparent', 'dark')).toBe('transparent');
    expect(resolveThemeColor('transparent', 'light')).toBe('transparent');
    expect(resolveThemeColor('#789abc', 'dark')).toBe('#789abc');
    expect(resolveThemeColor('#789abc', 'light')).toBe('#789abc');
  });
});
