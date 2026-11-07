export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  canvas_bg: string;
  grid_dot: string;
  panel_bg: string;
  panel_border: string;
  panel_shadow: string;
  text_primary: string;
  text_secondary: string;
  text_disabled: string;
  accent: string;
  accent_hover: string;
  accent_light: string;
  selection_stroke: string;
  selection_fill: string;
  danger: string;
}

export interface ThemeConfig {
  name: string;
  overrides: Record<string, string>;
  active?: ThemeColors;
}

export const THEME_PRESETS: Record<string, ThemeColors> = {
  'default-dark': {
    mode: 'dark',
    canvas_bg: '#090d16',
    grid_dot: '#334155',
    panel_bg: 'rgba(15, 23, 42, 0.78)',
    panel_border: 'rgba(255, 255, 255, 0.08)',
    panel_shadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
    text_primary: '#f8fafc',
    text_secondary: '#94a3b8',
    text_disabled: '#475569',
    accent: '#0284c7',
    accent_hover: '#0369a1',
    accent_light: '#38bdf8',
    selection_stroke: '#38bdf8',
    selection_fill: 'rgba(56, 189, 248, 0.08)',
    danger: '#ef4444',
  },
  'light': {
    mode: 'light',
    canvas_bg: '#f8fafc',
    grid_dot: '#cbd5e1',
    panel_bg: 'rgba(255, 255, 255, 0.88)',
    panel_border: 'rgba(15, 23, 42, 0.08)',
    panel_shadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
    text_primary: '#0f172a',
    text_secondary: '#64748b',
    text_disabled: '#94a3b8',
    accent: '#0284c7',
    accent_hover: '#0369a1',
    accent_light: '#0284c7',
    selection_stroke: '#0284c7',
    selection_fill: 'rgba(2, 132, 199, 0.08)',
    danger: '#dc2626',
  },
  'tokyo-night': {
    mode: 'dark',
    canvas_bg: '#1a1b26',
    grid_dot: '#2f3549',
    panel_bg: 'rgba(26, 27, 38, 0.85)',
    panel_border: 'rgba(255, 255, 255, 0.08)',
    panel_shadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
    text_primary: '#c0caf5',
    text_secondary: '#7aa2f7',
    text_disabled: '#414868',
    accent: '#7aa2f7',
    accent_hover: '#565f89',
    accent_light: '#7dcfff',
    selection_stroke: '#7aa2f7',
    selection_fill: 'rgba(122, 162, 247, 0.12)',
    danger: '#f7768e',
  },
  'catppuccin': {
    mode: 'dark',
    canvas_bg: '#1e1e2e',
    grid_dot: '#45475a',
    panel_bg: 'rgba(30, 30, 46, 0.85)',
    panel_border: 'rgba(255, 255, 255, 0.08)',
    panel_shadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
    text_primary: '#cdd6f4',
    text_secondary: '#a6adc8',
    text_disabled: '#585b70',
    accent: '#cba6f7',
    accent_hover: '#b4befe',
    accent_light: '#89dceb',
    selection_stroke: '#cba6f7',
    selection_fill: 'rgba(203, 166, 247, 0.12)',
    danger: '#f38ba8',
  },
};

export function darkenHex(hex: string, factor = 0.82): string {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const dr = Math.min(255, Math.max(0, Math.round(r * factor)));
      const dg = Math.min(255, Math.max(0, Math.round(g * factor)));
      const db = Math.min(255, Math.max(0, Math.round(b * factor)));
      return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${
        db.toString(16).padStart(2, '0')
      }`;
    }
  } else if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const dr = Math.min(255, Math.max(0, Math.round(r * factor)));
      const dg = Math.min(255, Math.max(0, Math.round(g * factor)));
      const db = Math.min(255, Math.max(0, Math.round(b * factor)));
      return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${
        db.toString(16).padStart(2, '0')
      }`;
    }
  }
  return hex;
}

export function calculateLuminanceMode(canvasBg: string): ThemeMode {
  const clean = canvasBg.trim().replace(/^#/, '');
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return y < 0.5 ? 'dark' : 'light';
    }
  } else if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return y < 0.5 ? 'dark' : 'light';
    }
  }
  return 'dark';
}

export function resolveTheme(config: ThemeConfig): ThemeColors {
  const base = THEME_PRESETS[config.name] || THEME_PRESETS['default-dark'];
  const overrides = config.overrides || {};
  const resolved: ThemeColors = {
    ...base,
    ...overrides,
  };
  if (overrides.mode === 'dark' || overrides.mode === 'light') {
    resolved.mode = overrides.mode;
  } else if (overrides.canvas_bg) {
    resolved.mode = calculateLuminanceMode(resolved.canvas_bg);
  }
  if (overrides.accent && !overrides.accent_hover) {
    resolved.accent_hover = darkenHex(overrides.accent, 0.82);
  }
  return resolved;
}

export function applyThemeToDom(
  theme: ThemeColors,
  target: HTMLElement = document.documentElement,
): void {
  target.setAttribute('data-theme-mode', theme.mode);
  target.style.setProperty('--color-canvas-bg', theme.canvas_bg);
  target.style.setProperty('--color-grid-dot', theme.grid_dot);
  target.style.setProperty('--color-panel-bg', theme.panel_bg);
  target.style.setProperty('--color-panel-border', theme.panel_border);
  target.style.setProperty('--color-panel-shadow', theme.panel_shadow);
  target.style.setProperty('--color-text-primary', theme.text_primary);
  target.style.setProperty('--color-text-secondary', theme.text_secondary);
  target.style.setProperty('--color-text-disabled', theme.text_disabled);
  target.style.setProperty('--color-accent', theme.accent);
  target.style.setProperty('--color-accent-hover', theme.accent_hover);
  target.style.setProperty('--color-accent-light', theme.accent_light);
  target.style.setProperty('--color-selection-stroke', theme.selection_stroke);
  target.style.setProperty('--color-selection-fill', theme.selection_fill);
  target.style.setProperty('--color-danger', theme.danger);
}
