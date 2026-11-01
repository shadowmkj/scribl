import { create } from 'zustand';

export interface AppOptions {
  dot_grid: boolean;
  default_tool: string;
  zoom_mode: string;
  stroke_smoothing: number;
  stroke_thinning: number;
  auto_save: boolean;
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
  mapleader: string;
  options: AppOptions;
  keymaps: KeymapEntry[];
  toolbar: ToolbarConfig;
}

export const DEFAULT_CONFIG: ScriblConfig = {
  mapleader: ' ',
  options: {
    dot_grid: true,
    default_tool: 'pen',
    zoom_mode: 'scrubby',
    stroke_smoothing: 0.5,
    stroke_thinning: 0.6,
    auto_save: true,
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
    { mode: 'n', lhs: '<leader>c', rhs: 'canvas.clear', desc: 'Clear Canvas' },
    { mode: 'n', lhs: '<leader>f', rhs: 'zoom.fit_all', desc: 'Fit Drawing' },
  ],
  toolbar: {
    position: 'bottom',
    items: [
      'select',
      'pen',
      'eraser',
      'zoom',
      '|',
      'undo',
      'redo',
      '|',
      'clear',
    ],
  },
};

interface ConfigState {
  config: ScriblConfig;
  configPath: string | null;
  configError: string | null;
  isLoaded: boolean;
  loadConfig: () => Promise<void>;
  setConfig: (config: ScriblConfig) => void;
  setError: (error: string | null) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: DEFAULT_CONFIG,
  configPath: null,
  configError: null,
  isLoaded: false,

  loadConfig: async () => {
    try {
      // Dynamic import to support web-only mode without crashing
      const { invoke } = await import('@tauri-apps/api/core');
      const config = await invoke<ScriblConfig>('get_config');
      const configPath = await invoke<string>('get_config_path');
      set({ config, configPath, isLoaded: true, configError: null });
    } catch {
      // Running in browser or mock environment
      set({ config: DEFAULT_CONFIG, isLoaded: true });
    }
  },

  setConfig: (config) => set({ config, configError: null }),
  setError: (configError) => set({ configError }),
}));
