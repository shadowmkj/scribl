import { create } from 'zustand';
import { ToolType, ZoomMode } from '../types/canvas';

export interface EditingTextState {
  elementId?: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

interface ToolState {
  currentTool: ToolType;
  zoomMode: ZoomMode;
  color: string;
  strokeSize: number;
  fontSize: number;
  editingText: EditingTextState | null;

  setTool: (tool: ToolType) => void;
  setZoomMode: (mode: ZoomMode) => void;
  setColor: (color: string) => void;
  setStrokeSize: (size: number) => void;
  setFontSize: (size: number) => void;
  startEditingText: (editingText: EditingTextState) => void;
  updateEditingTextDraft: (text: string) => void;
  stopEditingText: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: 'pen',
  zoomMode: 'scrubby',
  color: '#0284c7', // Sky Blue
  strokeSize: 4,
  fontSize: 24,
  editingText: null,

  setTool: (tool) => set({ currentTool: tool }),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setColor: (color) =>
    set((state) => ({
      color,
      editingText: state.editingText ? { ...state.editingText, color } : null,
    })),
  setStrokeSize: (strokeSize) => set({ strokeSize }),
  setFontSize: (fontSize) =>
    set((state) => ({
      fontSize,
      editingText: state.editingText ? { ...state.editingText, fontSize } : null,
    })),
  startEditingText: (editingText) => set({ editingText }),
  updateEditingTextDraft: (text) =>
    set((state) => ({
      editingText: state.editingText ? { ...state.editingText, text } : null,
    })),
  stopEditingText: () => set({ editingText: null }),
}));
