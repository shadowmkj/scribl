import { create } from 'zustand';
import { THEME_PRESETS, ThemeColors, ThemeConfig } from '../core/theme/themeManager';

export type { ThemeColors, ThemeConfig };

export interface AppOptions {
  dot_grid: boolean;
  default_tool: string;
  zoom_mode: string;
  stroke_smoothing: number;
  stroke_thinning: number;
  auto_save: boolean;
  default_pen_color: string;
}

export interface KeymapEntry {
  mode: string;
  lhs: string;
  rhs: string;
  desc?: string;
}

export interface ToolbarConfig {
  position: 'bottom' | 'top' | 'left' | 'right';
  items: string[];
}

export interface ScriblConfig {
  options: AppOptions;
  keymaps: KeymapEntry[];
  toolbar: ToolbarConfig;
  theme: ThemeConfig;
}

export const DEFAULT_CONFIG: ScriblConfig = {
  options: {
    dot_grid: true,
    default_tool: 'pen',
    zoom_mode: 'scrubby',
    stroke_smoothing: 0.5,
    stroke_thinning: 0.6,
    auto_save: true,
    default_pen_color: '#0284c7',
  },
  keymaps: [
    { mode: 'n', lhs: 'p', rhs: 'tool.pen', desc: 'Pen Tool' },
    { mode: 'n', lhs: '2', rhs: 'tool.pen', desc: 'Pen Tool' },
    { mode: 'n', lhs: 'e', rhs: 'tool.eraser', desc: 'Eraser Tool' },
    { mode: 'n', lhs: '3', rhs: 'tool.eraser', desc: 'Eraser Tool' },
    { mode: 'n', lhs: 'v', rhs: 'tool.select', desc: 'Select Tool' },
    { mode: 'n', lhs: '1', rhs: 'tool.select', desc: 'Select Tool' },
    { mode: 'n', lhs: 'z', rhs: 'tool.zoom', desc: 'Zoom Tool' },
    { mode: 'n', lhs: '4', rhs: 'tool.zoom', desc: 'Zoom Tool' },
    { mode: 'n', lhs: 't', rhs: 'tool.text', desc: 'Text Tool' },
    { mode: 'n', lhs: '5', rhs: 'tool.text', desc: 'Text Tool' },
    { mode: 'n', lhs: '<S-0>', rhs: 'zoom.reset', desc: 'Reset Zoom (100%)' },
    { mode: 'n', lhs: '<D-0>', rhs: 'zoom.reset', desc: 'Reset Zoom (100%)' },
    { mode: 'n', lhs: '=', rhs: 'zoom.in', desc: 'Zoom In' },
    { mode: 'n', lhs: '+', rhs: 'zoom.in', desc: 'Zoom In' },
    { mode: 'n', lhs: '-', rhs: 'zoom.out', desc: 'Zoom Out' },
    { mode: 'n', lhs: '<Space>', rhs: 'canvas.pan', desc: 'Pan Canvas' },
    { mode: 'n', lhs: '<D-z>', rhs: 'history.undo', desc: 'Undo' },
    { mode: 'n', lhs: '<D-S-z>', rhs: 'history.redo', desc: 'Redo' },
    { mode: 'n', lhs: '<D-y>', rhs: 'history.redo', desc: 'Redo' },
    { mode: 'n', lhs: '<BS>', rhs: 'selection.delete', desc: 'Delete Selected' },
    { mode: 'n', lhs: '<Del>', rhs: 'selection.delete', desc: 'Delete Selected' },
    { mode: 'n', lhs: '<D-s>', rhs: 'file.save', desc: 'Save Drawing' },
    { mode: 'n', lhs: '<D-o>', rhs: 'file.open', desc: 'Open Drawing' },
    { mode: 'n', lhs: 'c', rhs: 'canvas.clear', desc: 'Clear Canvas' },
    { mode: 'n', lhs: 'f', rhs: 'zoom.fit_all', desc: 'Fit Drawing' },
    { mode: 'n', lhs: '<D-,>', rhs: 'app.settings', desc: 'Open Settings' },
    { mode: 'n', lhs: '<D-c>', rhs: 'edit.copy', desc: 'Copy' },
    { mode: 'n', lhs: '<D-v>', rhs: 'edit.paste', desc: 'Paste' },
    { mode: 'n', lhs: '<D-x>', rhs: 'edit.cut', desc: 'Cut' },
    { mode: 'n', lhs: '<D-d>', rhs: 'edit.duplicate', desc: 'Duplicate' },
    { mode: 'v', lhs: 'r', rhs: 'selection.rotate', desc: 'Rotate Selection' },
    { mode: 'v', lhs: '<Esc>', rhs: 'selection.deselect', desc: 'Deselect' },
    { mode: 'v', lhs: 'd', rhs: 'selection.delete', desc: 'Delete Selected' },
    { mode: 'v', lhs: 'y', rhs: 'edit.copy', desc: 'Yank (Copy)' },
    { mode: 'v', lhs: 'p', rhs: 'edit.paste', desc: 'Put (Paste)' },
    { mode: 'v', lhs: '<D-c>', rhs: 'edit.copy', desc: 'Copy' },
    { mode: 'v', lhs: '<D-v>', rhs: 'edit.paste', desc: 'Paste' },
    { mode: 'v', lhs: '<D-x>', rhs: 'edit.cut', desc: 'Cut' },
    { mode: 'v', lhs: '<D-d>', rhs: 'edit.duplicate', desc: 'Duplicate' },
  ],
  toolbar: {
    position: 'bottom',
    items: [
      'select',
      'pen',
      'eraser',
      'text',
      'zoom',
      '|',
      'undo',
      'redo',
      '|',
      'clear',
    ],
  },
  theme: {
    name: 'default-dark',
    overrides: {},
    active: THEME_PRESETS['default-dark'],
  },
};

export type SettingsTab = 'general' | 'inking' | 'theme' | 'keybindings' | 'toolbar' | 'lua';

export function isDevVersion(version: string | null | undefined): boolean {
  if (!version) return false;
  return version.includes('+');
}

interface ConfigState {
  config: ScriblConfig;
  configPath: string | null;
  appVersion: string | null;
  configError: string | null;
  isLoaded: boolean;
  isSettingsOpen: boolean;
  activeSettingsTab: SettingsTab;
  loadConfig: () => Promise<void>;
  setConfig: (config: ScriblConfig) => void;
  setError: (error: string | null) => void;
  setAppVersion: (appVersion: string | null) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  saveConfigToDisk: (config: ScriblConfig) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: DEFAULT_CONFIG,
  configPath: null,
  appVersion: null,
  configError: null,
  isLoaded: false,
  isSettingsOpen: false,
  activeSettingsTab: 'general',

  loadConfig: async () => {
    try {
      // Dynamic import to support web-only mode without crashing
      const { invoke } = await import('@tauri-apps/api/core');
      const config = await invoke<ScriblConfig>('get_config');
      const configPath = await invoke<string>('get_config_path');
      let appVersion: string | null = null;
      try {
        appVersion = await invoke<string>('get_app_version');
      } catch {
        // Fallback for mock/older backends
      }
      set({ config, configPath, appVersion, isLoaded: true, configError: null });
    } catch {
      // Running in browser or mock environment
      set({ config: DEFAULT_CONFIG, isLoaded: true });
    }
  },

  setConfig: (config) => set({ config, configError: null }),
  setError: (configError) => set({ configError }),
  setAppVersion: (appVersion) => set({ appVersion }),

  openSettings: (tab = 'general') => set({ isSettingsOpen: true, activeSettingsTab: tab }),
  closeSettings: () => set({ isSettingsOpen: false }),

  saveConfigToDisk: async (updatedConfig: ScriblConfig) => {
    set({ config: updatedConfig, configError: null });
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_config', { config: updatedConfig });
    } catch (e) {
      // In browser/mock mode, changes persist in Zustand state
      console.warn('save_config IPC skipped in web mode:', e);
    }
  },
}));
