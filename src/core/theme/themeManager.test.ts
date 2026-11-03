import { describe, expect, it } from 'vitest';
import { applyThemeToDom, THEME_PRESETS } from './themeManager';

describe('themeManager', () => {
  it('applies theme variables to documentElement', () => {
    const theme = THEME_PRESETS['tokyo-night'];
    applyThemeToDom(theme);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-canvas-bg')).toBe('#1a1b26');
    expect(root.style.getPropertyValue('--color-accent')).toBe('#7aa2f7');
    expect(root.style.getPropertyValue('--color-panel-bg')).toBe('rgba(26, 27, 38, 0.85)');
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
});
