import { describe, expect, it } from 'vitest';
import { applyThemeToDom, darkenHex, resolveTheme, THEME_PRESETS } from './themeManager';

describe('themeManager', () => {
  it('applies theme variables to documentElement', () => {
    const theme = THEME_PRESETS['tokyo-night'];
    applyThemeToDom(theme);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-canvas-bg')).toBe('#1a1b26');
    expect(root.style.getPropertyValue('--color-accent')).toBe('#7aa2f7');
    expect(root.style.getPropertyValue('--color-panel-bg')).toBe('rgba(26, 27, 38, 0.85)');
    expect(root.getAttribute('data-theme-mode')).toBe('dark');
  });

  it('sets correct mode for all 4 presets', () => {
    expect(THEME_PRESETS['default-dark'].mode).toBe('dark');
    expect(THEME_PRESETS['tokyo-night'].mode).toBe('dark');
    expect(THEME_PRESETS['catppuccin'].mode).toBe('dark');
    expect(THEME_PRESETS['light'].mode).toBe('light');
  });

  it('resolves theme mode with explicit override and luminance fallback', () => {
    // Luminance fallback from white background
    const whiteTheme = resolveTheme({
      name: 'default-dark',
      overrides: { canvas_bg: '#ffffff' },
    });
    expect(whiteTheme.mode).toBe('light');

    // Luminance fallback from black background
    const blackTheme = resolveTheme({
      name: 'light',
      overrides: { canvas_bg: '#111111' },
    });
    expect(blackTheme.mode).toBe('dark');

    // Explicit mode override
    const explicitTheme = resolveTheme({
      name: 'default-dark',
      overrides: { mode: 'light', canvas_bg: '#000000' },
    });
    expect(explicitTheme.mode).toBe('light');
  });

  it('contains complete tokens for all 4 presets', () => {
    const presets = ['default-dark', 'light', 'tokyo-night', 'catppuccin'];
    for (const name of presets) {
      const p = THEME_PRESETS[name];
      expect(p).toBeDefined();
      expect(p.canvas_bg).toBeTruthy();
      expect(p.grid_dot).toBeTruthy();
      expect(p.panel_bg).toBeTruthy();
      expect(p.text_primary).toBeTruthy();
      expect(p.accent).toBeTruthy();
    }
  });

  it('auto-derives accent_hover when accent is overridden without explicit accent_hover', () => {
    const resolved = resolveTheme({
      name: 'default-dark',
      overrides: { accent: '#ff0000' },
    });
    expect(resolved.accent).toBe('#ff0000');
    expect(resolved.accent_hover).toBe('#d10000');
    expect(resolved.accent_hover).not.toBe('#0369a1'); // Not hardcoded blue
  });

  it('respects explicit accent_hover override when provided', () => {
    const resolved = resolveTheme({
      name: 'default-dark',
      overrides: { accent: '#ff0000', accent_hover: '#990000' },
    });
    expect(resolved.accent).toBe('#ff0000');
    expect(resolved.accent_hover).toBe('#990000');
  });

  it('resolves custom theme if registered in customThemes', () => {
    const customNord = {
      mode: 'dark' as const,
      canvas_bg: '#2e3440',
      grid_dot: '#434c5e',
      panel_bg: 'rgba(46, 52, 64, 0.88)',
      panel_border: 'rgba(216, 222, 233, 0.12)',
      panel_shadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
      text_primary: '#eceff4',
      text_secondary: '#d8dee9',
      text_disabled: '#4c566a',
      accent: '#88c0d0',
      accent_hover: '#81a1c1',
      accent_light: '#8fbcbb',
      selection_stroke: '#88c0d0',
      selection_fill: 'rgba(136, 192, 208, 0.15)',
      danger: '#bf616a',
    };

    const resolved = resolveTheme(
      {
        name: 'nord',
        overrides: {},
      },
      { nord: customNord },
    );

    expect(resolved.canvas_bg).toBe('#2e3440');
    expect(resolved.accent).toBe('#88c0d0');
    expect(resolved.mode).toBe('dark');
  });

  it('applies overrides on top of custom themes', () => {
    const customNord = {
      mode: 'dark' as const,
      canvas_bg: '#2e3440',
      grid_dot: '#434c5e',
      panel_bg: 'rgba(46, 52, 64, 0.88)',
      panel_border: 'rgba(216, 222, 233, 0.12)',
      panel_shadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
      text_primary: '#eceff4',
      text_secondary: '#d8dee9',
      text_disabled: '#4c566a',
      accent: '#88c0d0',
      accent_hover: '#81a1c1',
      accent_light: '#8fbcbb',
      selection_stroke: '#88c0d0',
      selection_fill: 'rgba(136, 192, 208, 0.15)',
      danger: '#bf616a',
    };

    const resolved = resolveTheme(
      {
        name: 'nord',
        overrides: { canvas_bg: '#ffffff' },
      },
      { nord: customNord },
    );

    expect(resolved.canvas_bg).toBe('#ffffff');
    expect(resolved.accent).toBe('#88c0d0');
    expect(resolved.mode).toBe('light'); // Derived from #ffffff canvas_bg
  });

  it('darkens hex colors correctly', () => {
    expect(darkenHex('#ffffff', 0.5)).toBe('#808080');
    expect(darkenHex('#000000', 0.5)).toBe('#000000');
    expect(darkenHex('#fff', 0.5)).toBe('#808080');
  });
});
